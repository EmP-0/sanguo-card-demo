/* =========================================================
 * 三国 · 战阵  ——  对战规则引擎（纯逻辑，可被 Node 直接引用）
 * 规则实现依据桌面规则文档，关键判定见 README / 游戏内「规则」面板
 * ========================================================= */
var SanguoEngine = (function () {
  'use strict';

  var Data = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : SanguoData;
  var ATTRS = Data.ATTRS;
  var ROWS = 3;
  var COLS = 3;

  /* ---------------- 基础工具 ---------------- */

  function cardOf(inst) { return Data.cards[inst.defId]; }
  function maxHp(inst) {
    return cardOf(inst).hp + (inst.bonusHp || 0) + (inst.effectHp || 0) + (inst.rowHp || 0) + (inst.auraHp || 0);
  }
  function atkOf(inst) {
    return cardOf(inst).atk + (inst.bonusAtk || 0) + (inst.effectAtk || 0) + (inst.rowAtk || 0) + (inst.auraAtk || 0);
  }
  function hpLeft(inst) { return maxHp(inst) - inst.damage; }
  function abilitiesOf(inst) { return cardOf(inst).abilities || []; }
  function attrsOf(inst) {
    var d = cardOf(inst);
    return (d.attrs && d.attrs.length) ? d.attrs : [d.attr];
  }
  function guardValue(state, inst) {
    if (!inst || !inst.guard) { return 0; }
    if (inst.guardUntilTurn != null && state.turnNumber >= inst.guardUntilTurn) { return 0; }
    return inst.guard;
  }
  function costTotal(cost) { return Data.costTotal(cost); }

  function costString(cost) {
    var parts = [];
    if (cost.generic) { parts.push(String(cost.generic)); }
    ATTRS.forEach(function (a) {
      for (var i = 0; i < (cost[a] || 0); i++) { parts.push(a); }
    });
    return parts.length ? parts.join('') : '0';
  }

  function adjacentCells(row, col, dirs) {
    var d = dirs || 'all';
    var out = [];
    var cand = [];
    if (d === 'all' || d === 'tb' || d === '前后') { cand.push([row - 1, col]); cand.push([row + 1, col]); }
    if (d === 'all' || d === 'lr' || d === '左右') { cand.push([row, col - 1]); cand.push([row, col + 1]); }
    cand.forEach(function (x) {
      if (x[0] >= 0 && x[0] < ROWS && x[1] >= 0 && x[1] < COLS) { out.push({ r: x[0], c: x[1] }); }
    });
    return out;
  }

  function conditionMet(state, player, inst, ab) {
    if (ab.row != null && inst.rowIndex != null && ab.row !== inst.rowIndex) { return false; }
    var cond = ab.condition;
    if (!cond) { return true; }
    var count = 0;
    player.battlefield.forEach(function (row) {
      row.forEach(function (u) {
        if (u && u.uid !== inst.uid && cardOf(u).camp === cond.camp) { count++; }
      });
    });
    return count >= (cond.count || 0);
  }

  function staticEffect(state, inst, type) {
    var player = state.players[inst.owner];
    var list = abilitiesOf(inst);
    for (var i = 0; i < list.length; i++) {
      var ab = list[i];
      if (ab.trigger === 'static' && ab.effect.type === type && conditionMet(state, player, inst, ab)) { return ab; }
    }
    return null;
  }

  function siegeOf(state, inst) {
    var base = cardOf(inst).siege;
    var player = state.players[inst.owner];
    abilitiesOf(inst).forEach(function (ab) {
      if (ab.trigger !== 'static' || !conditionMet(state, player, inst, ab)) { return; }
      if (ab.effect.type === 'siege') { base += ab.effect.value || 0; }
      if (ab.effect.type === 'siegeRow') { base += ab.effect.value || 0; }
    });
    return base;
  }

  function hasFirstStrike(state, inst) {
    if (staticEffect(state, inst, 'firstStrike')) { return true; }
    if (staticEffect(state, inst, 'firstStrikeCond') && atkOf(inst) > cardOf(inst).atk) { return true; }
    return false;
  }

  function hasTrample(state, inst) {
    if (staticEffect(state, inst, 'trample')) { return true; }
    if (staticEffect(state, inst, 'trampleCond') && atkOf(inst) > cardOf(inst).atk) { return true; }
    return false;
  }

  function isTaunt(state, inst) {
    return !!staticEffect(state, inst, 'taunt');
  }

  function recomputeAuras(state) {
    state.players.forEach(function (p) {
      p.battlefield.forEach(function (row) {
        row.forEach(function (u) { if (u) { u.auraAtk = 0; u.auraHp = 0; } });
      });
    });
    state.players.forEach(function (p) {
      p.battlefield.forEach(function (row, r) {
        row.forEach(function (src, c) {
          if (!src) { return; }
          abilitiesOf(src).forEach(function (ab) {
            if (ab.trigger !== 'static' || ab.effect.type !== 'aura') { return; }
            adjacentCells(r, c, ab.effect.directions).forEach(function (pos) {
              var t = p.battlefield[pos.r][pos.c];
              if (t && t.uid !== src.uid && cardOf(t).camp === ab.effect.camp) {
                t.auraAtk += ab.effect.atk || 0;
                t.auraHp += ab.effect.hp || 0;
              }
            });
          });
        });
      });
    });
    // 光环消失时最多掉到 1 血，避免光环结束直接秒杀
    state.players.forEach(function (p) {
      p.battlefield.forEach(function (row) {
        row.forEach(function (u) {
          if (u && hpLeft(u) <= 0) { u.damage = maxHp(u) - 1; }
        });
      });
    });
  }

  function abilityLabel(ab) {
    if (ab.trigger === 'onPlay') { return '进场'; }
    if (ab.trigger === 'onAttack') { return '进攻'; }
    if (ab.trigger === 'onDeath') { return '亡语'; }
    if (ab.trigger === 'strategy') { return '谋略'; }
    return '效果';
  }

  function applyAbilities(state, player, inst, trigger) {
    abilitiesOf(inst).forEach(function (ab) {
      if (ab.trigger !== trigger) { return; }
      if (!conditionMet(state, player, inst, ab)) { return; }
      var e = ab.effect;
      var label = abilityLabel(ab);
      if (e.type === 'draw') {
        var drawn = drawCards(state, player, e.value || 0);
        log(state, '【' + label + '】' + cardOf(inst).name + ' 抓了 ' + drawn.length + ' 张牌。', 'draw');
      } else if (e.type === 'buffAll') {
        var atkGain = e.atk || 0, hpGain = e.hp || 0;
        var n = 0;
        player.battlefield.forEach(function (row) {
          row.forEach(function (u) {
            if (u && cardOf(u).camp === e.camp) {
              u.effectAtk += atkGain;
              u.effectHp += hpGain;
              n++;
            }
          });
        });
        log(state, '【' + label + '】' + cardOf(inst).name + '：' + e.camp + '军 攻+' + atkGain + ' 命+' + hpGain + '（' + n + ' 个单位）。', 'play');
      } else if (e.type === 'buffSelf') {
        if (e.stat === 'hp') { inst.effectHp += e.value || 0; } else { inst.effectAtk += e.value || 0; }
        log(state, '【' + label + '】' + cardOf(inst).name + ' ' + (e.stat === 'hp' ? '生命' : '攻击') + ' +' + (e.value || 0) + '。', 'play');
      } else if (e.type === 'buffAdjacent') {
        var gained = 0;
        adjacentCells(inst.rowIndex, inst.colIndex, e.directions).forEach(function (pos) {
          var u = player.battlefield[pos.r][pos.c];
          if (!u) { return; }
          u.effectAtk += e.atk || 0;
          u.effectHp += e.hp || 0;
          gained++;
        });
        log(state, '【' + label + '】' + cardOf(inst).name + '：' + gained + ' 个相邻单位获得 +' + (e.atk || 0) + ' 攻 / +' + (e.hp || 0) + ' 生命。', 'play');
        recomputeAuras(state);
      } else if (e.type === 'buffRow') {
        var rowUnits = player.battlefield[e.row] || [];
        var rowHit = 0;
        rowUnits.forEach(function (u) {
          if (!u || u.uid === inst.uid) { return; }
          u.effectAtk += e.atk || 0;
          u.effectHp += e.hp || 0;
          rowHit++;
        });
        log(state, '【' + label + '】' + cardOf(inst).name + '：' + ['先锋', '中军', '后卫'][e.row] + '排 ' + rowHit + ' 个单位获得 +' + (e.atk || 0) + ' 攻 / +' + (e.hp || 0) + ' 生命。', 'play');
        recomputeAuras(state);
      }
    });
  }

  function applyRowAbilities(state, player, inst, row) {
    abilitiesOf(inst).forEach(function (ab) {
      if (ab.trigger !== 'static' || ab.row == null || ab.effect.type !== 'buffSelf') { return; }
      if (ab.row !== row) { return; }
      if (!conditionMet(state, player, inst, ab)) { return; }
      if (ab.effect.stat === 'hp') { inst.rowHp += ab.effect.value || 0; } else { inst.rowAtk += ab.effect.value || 0; }
      log(state, '【' + ['先锋', '中军', '后卫'][row] + '】' + cardOf(inst).name + ' ' +
        (ab.effect.stat === 'hp' ? '生命' : '攻击') + ' +' + (ab.effect.value || 0) + '。', 'play');
    });
  }

  function killUnit(state, player, row, col, unit, ev, side) {
    player.battlefield[row][col] = null;
    unit.diedTurn = state.turnNumber;
    player.graveyard.push(unit);
    log(state, cardOf(unit).name + ' 阵亡，进入墓地。', 'death');
    if (ev) {
      ev.deaths.push({
        uid: unit.uid, name: cardOf(unit).name, owner: player.index,
        row: row, col: col, side: side || 'def'
      });
    }
    applyAbilities(state, player, unit, 'onDeath');
    recomputeAuras(state);
  }

  function rand(state) {
    /* mulberry32 */
    state.randState = (state.randState + 0x6D2B79F5) | 0;
    var t = state.randState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function shuffle(arr, state) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rand(state) * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function log(state, text, cls) {
    state.log.push({ turn: state.turnNumber, text: text, cls: cls || 'sys' });
    if (state.log.length > 400) { state.log.shift(); }
  }

  function other(i) { return 1 - i; }

  function allUnits(player) {
    var out = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (player.battlefield[r][c]) { out.push(player.battlefield[r][c]); }
      }
    }
    return out;
  }

  function readyUnits(player, turnNumber) {
    var out = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var u = player.battlefield[r][c];
        if (u && u.summonTurn < turnNumber) { out.push({ unit: u, row: r, col: c }); }
      }
    }
    return out;
  }

  function findOnBoard(player, uid) {
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (player.battlefield[r][c] && player.battlefield[r][c].uid === uid) {
          return { unit: player.battlefield[r][c], row: r, col: c };
        }
      }
    }
    return null;
  }

  /* ---------------- 费用 ---------------- */

  function manaBreakdown(player) {
    var out = { '步': 0, '弓': 0, '骑': 0, '谋': 0, total: 0 };
    player.domestic.forEach(function (u) {
      if (!u.tapped) {
        attrsOf(u).forEach(function (a) { if (out[a] != null) { out[a]++; } });
        out.total++;
      }
    });
    return out;
  }

  /* 多兵权：每张内政牌只能产 1 点，但可以产它拥有的任意一种。
     先给指定色做二分匹配，剩下的牌再付任意费用。 */
  function planSpecific(untapped, cost) {
    var need = {}, S = 0;
    ATTRS.forEach(function (a) { need[a] = cost[a] || 0; S += need[a]; });
    if (!S) { return []; }
    if (untapped.length < S) { return null; }
    var cards = untapped, N = cards.length;
    var nodes = 1 + N + 4 + 1;
    var src = 0, cardBase = 1, attrBase = 1 + N, sink = attrBase + 4;
    var cap = [], flow = [], adj = [];
    for (var i = 0; i < nodes; i++) {
      var cr = [], fr = [];
      for (var j = 0; j < nodes; j++) { cr.push(0); fr.push(0); }
      cap.push(cr); flow.push(fr); adj.push([]);
    }
    function add(u, v, c) { cap[u][v] += c; adj[u].push(v); adj[v].push(u); }
    cards.forEach(function (u, i) {
      add(src, cardBase + i, 1);
      attrsOf(u).forEach(function (a) {
        var ai = ATTRS.indexOf(a);
        if (ai >= 0) { add(cardBase + i, attrBase + ai, 1); }
      });
    });
    ATTRS.forEach(function (a, i) { add(attrBase + i, sink, need[a]); });
    var total = 0;
    while (true) {
      var prev = [];
      for (var p = 0; p < nodes; p++) { prev.push(-1); }
      prev[src] = src;
      var q = [src];
      while (q.length) {
        var u = q.shift();
        for (var k = 0; k < adj[u].length; k++) {
          var v = adj[u][k];
          if (prev[v] === -1 && cap[u][v] - flow[u][v] > 0) { prev[v] = u; q.push(v); }
        }
      }
      if (prev[sink] === -1) { break; }
      var aug = Infinity, vv = sink;
      while (vv !== src) { var uu = prev[vv]; aug = Math.min(aug, cap[uu][vv] - flow[uu][vv]); vv = uu; }
      vv = sink;
      while (vv !== src) { var uu2 = prev[vv]; flow[uu2][vv] += aug; flow[vv][uu2] -= aug; vv = uu2; }
      total += aug;
    }
    if (total < S) { return null; }
    var assigned = [];
    cards.forEach(function (u, i) {
      for (var a = 0; a < 4; a++) {
        if (flow[cardBase + i][attrBase + a] > 0) { assigned.push({ u: u, attr: ATTRS[a] }); }
      }
    });
    return assigned;
  }

  function planCost(player, cost) {
    var untapped = player.domestic.filter(function (u) { return !u.tapped; });
    if (untapped.length < costTotal(cost)) { return null; }
    var specific = planSpecific(untapped, cost);
    if (specific === null) { return null; }
    var used = {};
    specific.forEach(function (x) { used[x.u.uid] = true; });
    var pool = untapped.filter(function (u) { return !used[u.uid]; });
    var generic = cost.generic || 0;
    if (pool.length < generic) { return null; }
    return { specific: specific, generic: pool.slice(0, generic) };
  }

  function canPay(player, cost) { return planCost(player, cost) !== null; }

  function payCost(player, cost) {
    var plan = planCost(player, cost);
    if (!plan) { throw new Error('内政费用不足'); }
    plan.specific.forEach(function (x) { x.u.tapped = true; });
    plan.generic.forEach(function (u) { u.tapped = true; });
  }

  /* ---------------- 建局 ---------------- */

  function makePlayer(state, index, cfg) {
    var deckDef = Data.getDeck(cfg.deckId);
    if (!deckDef) { throw new Error('未知套牌：' + cfg.deckId); }
    var list = [];
    deckDef.cards.forEach(function (entry) {
      for (var i = 0; i < entry.count; i++) {
        list.push({
          uid: 'u' + (state.nextUid++),
          defId: entry.id,
          owner: index,
          damage: 0,
          tapped: false,
          bonusAtk: 0,
          bonusHp: 0,
          effectAtk: 0,
          effectHp: 0,
          rowAtk: 0,
          rowHp: 0,
          auraAtk: 0,
          auraHp: 0,
          guard: 0,
          guardUntilTurn: 0,
          lastEffect: null,
          summonTurn: -1,
          isDeputy: entry.id === cfg.deputyId,
          deputyChosen: false,
          diedTurn: -1
        });
      }
    });
    shuffle(list, state);

    var player = {
      index: index,
      name: cfg.name || (index === 0 ? '你' : '电脑'),
      isAI: !!cfg.isAI,
      hero: {
        name: deckDef.hero.name,
        title: deckDef.hero.title,
        hp: deckDef.hero.hp,
        maxHp: deckDef.hero.hp,
        quote: deckDef.hero.quote
      },
      deck: list,
      hand: [],
      graveyard: [],
      domestic: [],
      battlefield: [[null, null, null], [null, null, null], [null, null, null]],
      focusUsed: false,
      turnsTaken: 0,
      deckId: cfg.deckId,
      deputyId: cfg.deputyId
    };

    for (var k = 0; k < 6; k++) {
      if (player.deck.length) { player.hand.push(player.deck.shift()); }
    }
    return player;
  }

  function createGame(opts) {
    opts = opts || {};
    var state = {
      seed: opts.seed >>> 0 || 20260101,
      randState: (opts.seed >>> 0) || 20260101,
      config: { cityHp: opts.cityHp || null, handSize: 6, rows: ROWS, cols: COLS },
      players: [],
      active: opts.firstPlayer ? 1 : 0,
      firstPlayer: opts.firstPlayer ? 1 : 0,
      turnNumber: 1,
      phase: 'mulligan',
      winner: null,
      pending: null,
      battle: null,
      log: [],
      nextUid: 1
    };
    state.players.push(makePlayer(state, 0, opts.players[0]));
    state.players.push(makePlayer(state, 1, opts.players[1]));
    state.players.forEach(function (p) {
      var hp = state.config.cityHp || p.hero.hp || 30;
      p.hero.maxHp = hp;
      p.hero.hp = hp;
    });
    return state;
  }

  /* ---------------- 调度 / 回合 ---------------- */

  function mulligan(state, picks) {
    if (state.phase !== 'mulligan') { throw new Error('当前不在调度阶段'); }
    picks = picks || {};
    var order = [state.firstPlayer, other(state.firstPlayer)];
    order.forEach(function (idx) {
      var p = state.players[idx];
      var chosen = picks[idx] || [];
      if (!chosen.length) {
        log(state, p.name + ' 保留起手牌。', 'sys');
        return;
      }
      var removed = [];
      p.hand = p.hand.filter(function (u) {
        if (chosen.indexOf(u.uid) >= 0) { removed.push(u); return false; }
        return true;
      });
      // 放到牌库底
      Array.prototype.push.apply(p.deck, removed);
      // 从牌库顶抓取等量
      var drawn = 0;
      for (var i = 0; i < removed.length; i++) {
        if (p.deck.length) { p.hand.push(p.deck.shift()); drawn++; }
      }
      shuffle(p.deck, state);
      log(state, p.name + ' 调度 ' + drawn + ' 张牌。', 'sys');
    });
    beginTurn(state);
    return state;
  }

  function drawCards(state, player, n) {
    var drawn = [];
    for (var i = 0; i < n; i++) {
      if (!player.deck.length) { break; }
      var c = player.deck.shift();
      player.hand.push(c);
      drawn.push(c);
    }
    return drawn;
  }

  function beginTurn(state) {
    var p = state.players[state.active];
    p.turnsTaken++;
    p.focusUsed = false;
    p.domestic.forEach(function (u) { u.tapped = false; });
    state.phase = 'prep';
    state.pending = null;
    state.battle = null;

    var round = Math.ceil(state.turnNumber / 2);
    log(state, '第 ' + round + ' 回合 · ' + p.name + '的回合', 'turn');

    var firstHandicap = state.turnNumber === 1 && p.index === state.firstPlayer;
    if (firstHandicap) {
      log(state, p.name + ' 先手，第一回合不抓牌。', 'sys');
    } else {
      var drawn = drawCards(state, p, 1);
      if (drawn.length) {
        log(state, p.name + ' 抓了 1 张牌。', 'draw');
      } else {
        /* Demo 补充规则：牌库耗尽后，抓牌改为 1 点疲劳伤害，避免对局无限僵持 */
        p.hero.hp -= 1;
        log(state, p.name + ' 牌库已空，受到 1 点疲劳伤害。', 'damage');
        if (p.hero.hp <= 0) {
          state.winner = other(p.index);
          state.phase = 'gameover';
          log(state, p.name + ' 主将血量归零，' + state.players[state.winner].name + ' 获胜！', 'win');
        }
      }
    }
  }

  function endTurn(state) {
    if (state.winner !== null) { throw new Error('对局已结束'); }
    if (state.phase !== 'cleanup') { throw new Error('请先完成战斗阶段'); }
    var p = state.players[state.active];
    log(state, p.name + ' 结束回合。', 'sys');
    state.pending = null;
    state.battle = null;
    state.active = other(state.active);
    state.turnNumber++;
    beginTurn(state);
    return state;
  }

  /* ---------------- 行动 ---------------- */

  function assertActive(state, playerIndex) {
    if (state.winner !== null) { throw new Error('对局已结束'); }
    if (state.active !== playerIndex) { throw new Error('现在不是你的回合'); }
  }

  /* 登场效果：只在从手牌打入战场时触发，派遣内政区不触发 */
  function triggerOnPlay(state, player, inst, row, col) {
    var def = cardOf(inst);
    var eff = def.effect;
    if (!eff) { return null; }
    var enemy = state.players[other(player.index)];

    if (eff.type === 'atk') {
      inst.effectAtk = (inst.effectAtk || 0) + eff.value;
      log(state, '【登场】' + def.name + ' 永久获得 +' + eff.value + ' 攻击力。', 'play');
      return { type: 'atk', value: eff.value };
    }

    if (eff.type === 'guard') {
      var rounds = eff.rounds || 1;
      inst.guard = eff.value;
      inst.guardUntilTurn = state.turnNumber + 1 + rounds;
      log(state, '【登场】' + def.name + ' 获得 ' + eff.value + ' 点减伤（持续 ' + rounds + ' 回合）。', 'play');
      return { type: 'guard', value: eff.value, rounds: rounds };
    }

    if (eff.type === 'damage') {
      var target = null, tRow = -1;
      for (var r = 0; r < ROWS; r++) {
        if (enemy.battlefield[r][col]) { target = enemy.battlefield[r][col]; tRow = r; break; }
      }
      if (!target) {
        log(state, '【登场】' + def.name + ' 同列没有敌方单位，伤害未触发。', 'sys');
        return { type: 'damage', target: null };
      }
      var reduced = guardValue(state, target);
      var dmg = Math.max(0, eff.value - reduced);
      target.damage += dmg;
      log(state, '【登场】' + def.name + ' 对 ' + cardOf(target).name + ' 造成 ' + dmg + ' 点伤害' +
        (reduced ? '（减伤 ' + reduced + '）' : '') + '。', 'damage');
      if (hpLeft(target) <= 0) {
        killUnit(state, enemy, tRow, col, target, null, 'def');
      }
      return { type: 'damage', target: target, value: dmg };
    }

    if (eff.type === 'draw') {
      var drawn = drawCards(state, player, eff.value);
      if (drawn.length) {
        log(state, '【登场】' + def.name + ' 抓了 ' + drawn.length + ' 张牌。', 'draw');
      } else {
        log(state, '【登场】' + def.name + ' 牌库已空，无法抓牌。', 'sys');
      }
      return { type: 'draw', value: drawn.length };
    }
    return null;
  }

  function playCard(state, uid, row, col, targetUid) {
    var p = state.players[state.active];
    assertActive(state, p.index);
    if (state.phase !== 'prep' && state.phase !== 'cleanup') {
      throw new Error('战斗阶段无法打出卡牌');
    }
    if (state.pending) { throw new Error('请先处理副将加成'); }
    var handIdx = -1;
    for (var i = 0; i < p.hand.length; i++) { if (p.hand[i].uid === uid) { handIdx = i; break; } }
    if (handIdx < 0) { throw new Error('该牌不在手牌中'); }
    var inst = p.hand[handIdx];
    var def = cardOf(inst);
    if (!canPay(p, def.cost)) { throw new Error('内政费用不足：需要 ' + costString(def.cost)); }

    if (def.category === '谋略') {
      var target = null;
      if (def.targeted) {
        if (!targetUid) { throw new Error('请选择目标单位'); }
        var found = findOnBoard(p, targetUid);
        if (!found) { throw new Error('目标单位不在战场上'); }
        target = found.unit;
      }
      payCost(p, def.cost);
      p.hand.splice(handIdx, 1);
      log(state, p.name + ' 使用谋略 ' + def.name + '（' + costString(def.cost) + '）。', 'play');
      applyAbilities(state, p, inst, 'strategy');
      if (target) {
        var resist = 0;
        abilitiesOf(inst).forEach(function (ab) {
          if (ab.trigger === 'strategy' && ab.effect.type === 'resist') { resist += ab.effect.value || 0; }
        });
        if (resist > 0) {
          target.guard = Math.max(target.guard || 0, resist);
          target.guardUntilTurn = state.turnNumber + 1;
          log(state, '【抵抗】' + cardOf(target).name + ' 本回合获得 ' + resist + ' 点减伤。', 'play');
        }
      }
      inst.diedTurn = state.turnNumber;
      p.graveyard.push(inst);
      recomputeAuras(state);
      return inst;
    }

    if (row == null || col == null || row < 0 || row >= ROWS || col < 0 || col >= COLS) {
      throw new Error('请选择战场格子');
    }
    if (p.battlefield[row][col]) { throw new Error('该格已有单位'); }

    payCost(p, def.cost);
    p.hand.splice(handIdx, 1);
    inst.damage = 0;
    inst.tapped = false;
    inst.rowIndex = row;
    inst.colIndex = col;
    inst.summonTurn = state.turnNumber;
    p.battlefield[row][col] = inst;

    log(state, p.name + ' 打出 ' + def.name + '（' + costString(def.cost) + '），布阵于 ' + (row + 1) + ' 排 ' + (col + 1) + ' 列。', 'play');

    inst.lastEffect = triggerOnPlay(state, p, inst, row, col);
    applyAbilities(state, p, inst, 'onPlay');
    applyRowAbilities(state, p, inst, row);
    recomputeAuras(state);

    if (inst.isDeputy && !inst.deputyChosen) {
      state.pending = { type: 'deputy', playerIndex: p.index, uid: inst.uid };
    }
    return inst;
  }

  function deployDomestic(state, uid) {
    var p = state.players[state.active];
    assertActive(state, p.index);
    if (state.phase !== 'prep' && state.phase !== 'cleanup') {
      throw new Error('战斗阶段无法派遣内政');
    }
    if (state.pending) { throw new Error('请先处理副将加成'); }
    if (p.focusUsed) { throw new Error('本回合已派遣过内政单位'); }
    var handIdx = -1;
    for (var i = 0; i < p.hand.length; i++) { if (p.hand[i].uid === uid) { handIdx = i; break; } }
    if (handIdx < 0) { throw new Error('该牌不在手牌中'); }
    var inst = p.hand[handIdx];
    var def = cardOf(inst);
    if (def.category === '谋略') { throw new Error('谋略牌不能派遣到内政区'); }
    p.hand.splice(handIdx, 1);
    inst.tapped = false;
    inst.summonTurn = state.turnNumber;
    p.domestic.push(inst);
    p.focusUsed = true;
    log(state, p.name + ' 派遣 ' + def.name + ' 进入内政区（' + def.attr + '），本回合内政派遣次数已用完。', 'play');
    return inst;
  }

  function applyDeputyBonus(state, choice) {
    var pending = state.pending;
    if (!pending || pending.type !== 'deputy') { throw new Error('没有待处理的副将加成'); }
    var p = state.players[pending.playerIndex];
    var found = findOnBoard(p, pending.uid);
    if (!found) { throw new Error('副将不在战场上'); }
    var inst = found.unit;
    var def = cardOf(inst);
    if (choice === 'atk') {
      inst.bonusAtk = 1;
      log(state, '副将 ' + def.name + ' 登场，选择 +1 攻击力。', 'play');
    } else {
      inst.bonusHp = 1;
      log(state, '副将 ' + def.name + ' 登场，选择 +1 生命值。', 'play');
    }
    inst.deputyChosen = true;
    state.pending = null;
    return inst;
  }

  function enterBattle(state) {
    var p = state.players[state.active];
    assertActive(state, p.index);
    if (state.phase !== 'prep') { throw new Error('现在不是整备阶段'); }
    if (state.pending) { throw new Error('请先处理副将加成'); }
    state.phase = 'battle';
    return readyUnits(p, state.turnNumber);
  }

  function startBattle(state, uids) {
    var p = state.players[state.active];
    assertActive(state, p.index);
    if (state.phase !== 'battle') { throw new Error('现在不是战斗阶段'); }
    if (state.pending) { throw new Error('请先处理副将加成'); }
    if (!uids) {
      uids = readyUnits(p, state.turnNumber).map(function (x) { return x.unit.uid; });
    }
    var wanted = {};
    uids.forEach(function (u) { wanted[u] = true; });

    var queue = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var u = p.battlefield[r][c];
        if (u && wanted[u.uid] && u.summonTurn < state.turnNumber && !isTaunt(state, u)) {
          queue.push({ uid: u.uid, row: r, col: c });
        }
      }
    }
    state.battle = { queue: queue, idx: 0 };
    if (!queue.length) {
      log(state, p.name + ' 没有单位发动进攻。', 'sys');
      state.battle = null;
      state.phase = 'cleanup';
      return { queue: [] };
    }
    log(state, p.name + ' 发动进攻：' + queue.length + ' 个单位出击。', 'attack');
    return { queue: queue };
  }

  function peekAttack(state) {
    if (state.winner !== null) { return null; }
    if (state.phase !== 'battle' || !state.battle) { return null; }
    var b = state.battle;
    if (b.idx >= b.queue.length) { return null; }
    var q = b.queue[b.idx];
    var p = state.players[state.active];
    var e = state.players[other(state.active)];
    var attacker = p.battlefield[q.row][q.col];
    if (!attacker || attacker.uid !== q.uid) { return null; }
    var defender = null, dRow = -1;
    for (var r = 0; r < ROWS; r++) {
      if (e.battlefield[r][q.col]) { defender = e.battlefield[r][q.col]; dRow = r; break; }
    }
    return {
      attacker: attacker,
      attackerRow: q.row,
      attackerCol: q.col,
      defender: defender,
      defenderRow: dRow,
      defenderCol: q.col,
      col: q.col
    };
  }

  function finishBattle(state) {
    state.battle = null;
    if (state.winner === null) { state.phase = 'cleanup'; }
  }

  function nextAttack(state) {
    if (state.winner !== null) { return { done: true, gameOver: true }; }
    if (state.phase !== 'battle' || !state.battle) { return { done: true }; }
    var b = state.battle;
    var p = state.players[state.active];
    var e = state.players[other(state.active)];

    while (b.idx < b.queue.length) {
      var q = b.queue[b.idx++];
      var attacker = p.battlefield[q.row][q.col];
      if (!attacker || attacker.uid !== q.uid) { continue; }
      var def = cardOf(attacker);
      applyAbilities(state, p, attacker, 'onAttack');
      // 鼓舞：给本次宣告顺序中的下一个进攻将领永久 +攻
      abilitiesOf(attacker).forEach(function (ab) {
        if (ab.trigger !== 'onAttack' || ab.effect.type !== 'nextAttacker') { return; }
        if (!conditionMet(state, p, attacker, ab)) { return; }
        for (var qi = b.idx; qi < b.queue.length; qi++) {
          var nq = b.queue[qi];
          var nu = p.battlefield[nq.row][nq.col];
          if (nu && nu.uid === nq.uid && cardOf(nu).category === '将领') {
            var gain = ab.effect.value || 1;
            nu.bonusAtk = (nu.bonusAtk || 0) + gain;
            log(state, '【鼓舞】' + def.name + ' 使下一个进攻的 ' + cardOf(nu).name + ' 攻击 +' + gain + '。', 'play');
            break;
          }
        }
      });
      var defender = null, dRow = -1;
      for (var r = 0; r < ROWS; r++) {
        if (e.battlefield[r][q.col]) { defender = e.battlefield[r][q.col]; dRow = r; break; }
      }

      var ev = {
        attacker: { uid: attacker.uid, name: def.name, row: q.row, col: q.col, atk: atkOf(attacker) },
        defender: null,
        deaths: [],
        cityDamage: 0,
        heroHp: e.hero.hp,
        done: false,
        gameOver: false
      };

      if (!defender) {
        var siege = siegeOf(state, attacker);
        e.hero.hp -= siege;
        ev.cityDamage = siege;
        ev.heroHp = e.hero.hp;
        log(state, def.name + ' 突破防线，对 ' + e.hero.name + ' 造成 ' + siege + ' 点攻城伤害！', 'damage');
        if (e.hero.hp <= 0) {
          state.winner = p.index;
          state.phase = 'gameover';
          state.battle = null;
          ev.gameOver = true;
          ev.done = true;
          log(state, e.hero.name + ' 主将血量归零，' + p.name + ' 获胜！', 'win');
          return ev;
        }
      } else {
        var ddef = cardOf(defender);
        var atkA = atkOf(attacker);
        var atkB = atkOf(defender);
        var guardD = guardValue(state, defender);
        var guardA = guardValue(state, attacker);
        var dmgToDef = Math.max(0, atkA - guardD);
        var attackImmune = staticEffect(state, attacker, 'attackImmune');
        var dmgToAtk = attackImmune ? 0 : Math.max(0, atkB - guardA);
        var defenderHpBefore = hpLeft(defender);
        var attackerHpBefore = hpLeft(attacker);
        var aFirst = hasFirstStrike(state, attacker);
        var dFirst = hasFirstStrike(state, defender);
        if (aFirst && !dFirst) {
          defender.damage += dmgToDef;
          if (hpLeft(defender) > 0) { attacker.damage += dmgToAtk; } else { dmgToAtk = 0; }
          log(state, '【敏捷】' + def.name + ' 先手结算。', 'attack');
        } else if (dFirst && !aFirst) {
          attacker.damage += dmgToAtk;
          if (hpLeft(attacker) > 0) { defender.damage += dmgToDef; } else { dmgToDef = 0; }
          log(state, '【敏捷】' + ddef.name + ' 先手反击。', 'attack');
        } else {
          defender.damage += dmgToDef;
          attacker.damage += dmgToAtk;
        }
        ev.defender = {
          uid: defender.uid, name: ddef.name, row: dRow, col: q.col,
          atk: atkB, guard: guardD, hpLeftBefore: defenderHpBefore, hpLeftAfter: hpLeft(defender)
        };
        ev.dmgToDef = dmgToDef;
        ev.dmgToAtk = dmgToAtk;
        ev.attackImmune = !!attackImmune;
        ev.guardD = guardD;
        ev.guardA = guardA;
        log(state, def.name + '（' + atkA + '攻' + (guardD ? '，被减伤 ' + guardD : '') + '）与 ' + ddef.name + '（' + atkB + '攻' + (guardA ? '，被减伤 ' + guardA : '') + '）交战，造成 ' + dmgToDef + ' / ' + dmgToAtk + ' 点伤害。', 'attack');
        if (attackImmune) {
          log(state, '【免伤】' + def.name + ' 进攻中不会受到伤害。', 'attack');
        }

        if (hpLeft(defender) <= 0) {
          killUnit(state, e, dRow, q.col, defender, ev, 'def');
          if (hasTrample(state, attacker) && dmgToDef > defenderHpBefore) {
            var excess = dmgToDef - defenderHpBefore;
            for (var tr = 0; tr < ROWS && excess > 0; tr++) {
              var t = e.battlefield[tr][q.col];
              if (!t) { continue; }
              var tg = guardValue(state, t);
              var applied = Math.max(0, excess - tg);
              var tHpBefore = hpLeft(t) + applied;
              t.damage += applied;
              ev.trample = ev.trample || [];
              ev.trample.push({ uid: t.uid, name: cardOf(t).name, row: tr, col: q.col, damage: applied });
              log(state, '【贯穿】' + def.name + ' 的 ' + applied + ' 点溢出伤害击中 ' + cardOf(t).name + '。', 'damage');
              if (hpLeft(t) <= 0) {
                killUnit(state, e, tr, q.col, t, ev, 'def');
                excess = applied - tHpBefore;
              } else {
                excess = 0;
              }
            }
          }
        }
        if (hpLeft(attacker) <= 0) {
          killUnit(state, p, q.row, q.col, attacker, ev, 'atk');
        }
        recomputeAuras(state);
      }

      if (b.idx >= b.queue.length) {
        ev.done = true;
        finishBattle(state);
      }
      return ev;
    }
    finishBattle(state);
    return { done: true };
  }

  return {
    ROWS: ROWS,
    COLS: COLS,
    ATTRS: ATTRS,
    cardOf: cardOf,
    maxHp: maxHp,
    atkOf: atkOf,
    hpLeft: hpLeft,
    guardValue: guardValue,
    siegeOf: siegeOf,
    hasFirstStrike: hasFirstStrike,
    hasTrample: hasTrample,
    isTaunt: isTaunt,
    costTotal: costTotal,
    costString: costString,
    manaBreakdown: manaBreakdown,
    canPay: canPay,
    payCost: payCost,
    allUnits: allUnits,
    readyUnits: readyUnits,
    findOnBoard: findOnBoard,
    createGame: createGame,
    mulligan: mulligan,
    drawCards: drawCards,
    beginTurn: beginTurn,
    endTurn: endTurn,
    playCard: playCard,
    deployDomestic: deployDomestic,
    applyDeputyBonus: applyDeputyBonus,
    enterBattle: enterBattle,
    startBattle: startBattle,
    peekAttack: peekAttack,
    nextAttack: nextAttack,
    rand: rand
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = SanguoEngine; }
