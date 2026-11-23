/* =========================================================
 * 三国 · 战阵  ——  电脑对手 AI
 * 目标：能完成“调度—内政—出牌—进攻—修整”的完整循环，并做出合理的攻防取舍
 * ========================================================= */
var SanguoAI = (function () {
  'use strict';

  var E = (typeof module !== 'undefined' && module.exports) ? require('./engine.js') : SanguoEngine;
  var Data = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : SanguoData;

  function jitter(seedA, seedB, seedC) {
    var x = Math.sin(seedA * 12.9898 + seedB * 78.233 + seedC * 37.719) * 43758.5453;
    return (x - Math.floor(x)) - 0.5;
  }

  /* ---------------- 调度 ---------------- */

  function mulligan(state, playerIndex) {
    var p = state.players[playerIndex];
    var replace = [];
    for (var i = 0; i < p.hand.length && replace.length < 4; i++) {
      var inst = p.hand[i];
      var def = E.cardOf(inst);
      if (inst.isDeputy) { continue; }
      var total = E.costTotal(def.cost);
      if (total >= 4) { replace.push(inst.uid); }
    }
    // 若起手太贵，再多换一张 3 费
    var cheap = p.hand.filter(function (u) {
      var d = E.cardOf(u);
      return E.costTotal(d.cost) <= 2 && replace.indexOf(u.uid) < 0;
    }).length;
    if (cheap === 0 && replace.length < 4) {
      for (var j = 0; j < p.hand.length && replace.length < 4; j++) {
        var inst2 = p.hand[j];
        var def2 = E.cardOf(inst2);
        if (inst2.isDeputy || replace.indexOf(inst2.uid) >= 0) { continue; }
        if (E.costTotal(def2.cost) === 3) { replace.push(inst2.uid); }
      }
    }
    return replace;
  }

  /* ---------------- 副将加成 ---------------- */

  function chooseDeputyBonus(state) {
    var pend = state.pending;
    if (!pend) { return 'hp'; }
    var p = state.players[pend.playerIndex];
    var found = E.findOnBoard(p, pend.uid);
    if (!found) { return 'hp'; }
    var def = E.cardOf(found.unit);
    // 强攻型加血提高交换能力，脆皮高攻加攻击以跨过击杀线
    return def.atk >= def.hp ? 'hp' : 'atk';
  }

  /* ---------------- 内政 ---------------- */

  function chooseDomestic(state, p) {
    if (p.focusUsed) { return null; }
    if (p.hand.length <= 1) { return null; }
    if (p.domestic.length >= 8) { return null; }

    var best = null;
    var bestScore = Infinity;
    for (var i = 0; i < p.hand.length; i++) {
      var inst = p.hand[i];
      var def = E.cardOf(inst);
      if (inst.isDeputy) { continue; }
      if (def.category === '谋略') { continue; }
      var total = E.costTotal(def.cost);
      // 只用低费、非传奇的牌去铺内政
      if (total > 3) { continue; }
      var s = total * 1.5 + def.atk * 0.55 + def.hp * 0.45 + def.siege * 0.5 + (def.legendary ? 3 : 0);
      if (def.effect) { s += 2.5; }
      s += jitter(inst.uid.length, total, def.atk);
      if (s < bestScore) { bestScore = s; best = inst; }
    }
    if (!best) { return null; }

    var mana = p.domestic.filter(function (u) { return !u.tapped; }).length;
    if (mana >= 7) { return null; }
    if (state.turnNumber <= 3) { return best.uid; }
    if (mana < 5) { return best.uid; }
    if (p.hand.length >= 6) { return best.uid; }
    // 后期只在需要补色或手牌充裕时继续铺内政
    var needColors = colorNeeds(state, p);
    if (needColors[E.cardOf(best).attr] > 0) { return best.uid; }
    if (p.hand.length >= 4 && E.costTotal(E.cardOf(best).cost) <= 1) { return best.uid; }
    return null;
  }

  function colorNeeds(state, p) {
    var need = { '步': 0, '弓': 0, '骑': 0, '谋': 0 };
    var have = E.manaBreakdown(p);
    p.hand.forEach(function (inst) {
      var c = E.cardOf(inst).cost;
      for (var i = 0; i < E.ATTRS.length; i++) {
        var a = E.ATTRS[i];
        var n = c[a] || 0;
        if (n > have[a] + need[a]) { need[a] += n - have[a] - need[a]; }
      }
    });
    return need;
  }

  /* ---------------- 出牌 ---------------- */

  function choosePlay(state, p) {
    if (E.allUnits(p).length >= 9) { return null; }
    var best = null;
    for (var i = 0; i < p.hand.length; i++) {
      var inst = p.hand[i];
      var def = E.cardOf(inst);
      if (!E.canPay(p, def.cost)) { continue; }
      if (def.category === '谋略') {
        var tgt = spellTarget(state, p, def);
        if (!tgt) { continue; }
        var spellScore = 2.2 + (def.targeted && tgt.gain ? 0.8 : 0);
        if (!best || spellScore > best.score) {
          best = { uid: inst.uid, row: null, col: null, targetUid: tgt.uid, score: spellScore };
        }
        continue;
      }
      var cell = bestCell(state, p, inst);
      if (!cell) { continue; }
      var base = def.atk * 1.05 + def.hp * 0.9 + def.siege * 1.25 + (def.legendary ? 0.8 : 0);
      var effScore = 0;
      if (def.effect) {
        if (def.effect.type === 'draw') { effScore = 1.5; }
        else if (def.effect.type === 'damage') { effScore = 1.1; }
        else if (def.effect.type === 'atk') { effScore = 0.8; }
        else if (def.effect.type === 'guard') { effScore = 0.6; }
      }
      if (def.category === '谋略') { effScore += 1.2; }
      if (def.abilities && def.abilities.length) { effScore += 0.7; }
      if (hasKeyword(def, 'firstStrike') || hasKeyword(def, 'firstStrikeCond')) { effScore += 0.7; }
      if (hasKeyword(def, 'taunt')) { effScore += 0.4; }
      if (hasKeyword(def, 'nextAttacker')) { effScore += 0.6; }
      var score = base - E.costTotal(def.cost) * 0.45 + cell.score * 0.6 + effScore;
      score += jitter(inst.uid.length, inst.defId.length, def.atk);
      if (!best || score > best.score) {
        best = { uid: inst.uid, row: cell.row, col: cell.col, targetUid: null, score: score };
      }
    }
    return best;
  }

  function hasKeyword(def, type) {
    return (def.abilities || []).some(function (a) { return a.effect && a.effect.type === type; });
  }

  function spellTarget(state, p, def) {
    if (!def.targeted) { return { uid: null }; }
    var best = null;
    E.allUnits(p).forEach(function (u) {
      var hp = E.hpLeft(u);
      var max = E.maxHp(u);
      var val = E.atkOf(u) + (max - hp) * 1.2;
      if (!best || val > best.score) { best = { uid: u.uid, score: val, gain: max - hp }; }
    });
    return best;
  }

  function bestCell(state, p, inst) {
    var e = state.players[1 - p.index];
    var def = E.cardOf(inst);
    var best = null;
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        if (p.battlefield[r][c]) { continue; }
        var score = 0;
        var enemyCol = [];
        for (var rr = 0; rr < 3; rr++) {
          if (e.battlefield[rr][c]) { enemyCol.push(e.battlefield[rr][c]); }
        }
        var front = enemyCol.length ? enemyCol[0] : null;
        var threat = 0;
        var enemySiege = 0;
        enemyCol.forEach(function (u) {
          threat += E.atkOf(u);
          enemySiege += E.cardOf(u).siege;
        });

        if (front) {
          var fHp = E.hpLeft(front);
          var fAtk = E.atkOf(front);
          if (def.atk >= fHp) { score += 3.2; }
          if (fAtk >= def.hp) { score -= 2.2; } else { score += 0.5; }
          score += E.cardOf(front).siege * 0.8;
          if (fHp <= 2) { score += 0.8; }
        } else {
          score += 2.0 + def.siege * 1.3;
        }

        if (def.effect && def.effect.type === 'damage' && front) {
          score += 2.2;
          if (E.hpLeft(front) <= def.effect.value) { score += 2.5; }
        }
        if (def.effect && def.effect.type === 'guard' && front) { score += 0.8; }

        var rowAbs = (def.abilities || []).filter(function (a) {
          return a.row != null;
        });
        if (rowAbs.length) {
          var hitRow = false;
          rowAbs.forEach(function (a) { if (a.row === r) { hitRow = true; } });
          score += hitRow ? 3.0 : -1.2;
        }
        var auraAbs = (def.abilities || []).filter(function (a) {
          return a.effect && a.effect.type === 'aura';
        });
        if (auraAbs.length) {
          var adj = 0;
          [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(function (pos) {
            if (pos[0] >= 0 && pos[0] < 3 && pos[1] >= 0 && pos[1] < 3) {
              var au = p.battlefield[pos[0]][pos[1]];
              if (au && E.cardOf(au).camp === def.camp) { adj++; }
            }
          });
          score += adj * 1.6 + 0.8;
        }

        // 防守价值：这一列若无人挡，敌方的攻城值会直接砸到主将
        var mine = 0;
        for (var mr = 0; mr < 3; mr++) { if (p.battlefield[mr][c]) { mine++; } }
        score += enemySiege * (mine === 0 ? 0.6 : 0.2);

        if (r === 0) {
          score += def.hp >= def.atk ? 1.5 : 0.7;
        } else {
          score += def.atk > def.hp ? 1.0 : 0.2;
        }
        score += threat * 0.1;
        score -= mine * 0.8;
        score += jitter(r + 1, c + 1, def.atk + def.hp);

        if (!best || score > best.score) { best = { row: r, col: c, score: score }; }
      }
    }
    return best;
  }

  /* ---------------- 一回合内的行动序列 ---------------- */

  function nextPrepAction(state) {
    var p = state.players[state.active];
    if (state.phase !== 'prep' && state.phase !== 'cleanup') { return null; }
    if (state.pending && state.pending.playerIndex === p.index) {
      return { type: 'deputy', choice: chooseDeputyBonus(state) };
    }
    var deploy = chooseDomestic(state, p);
    if (deploy) { return { type: 'deploy', uid: deploy }; }
    var play = choosePlay(state, p);
    if (play) { return { type: 'play', uid: play.uid, row: play.row, col: play.col, targetUid: play.targetUid }; }
    return null;
  }

  /* ---------------- 进攻计划（带简易前瞻） ---------------- */

  function planAttackers(state) {
    var p = state.players[state.active];
    var e = state.players[1 - p.index];
    var ready = E.readyUnits(p, state.turnNumber).filter(function (x) { return !E.isTaunt(state, x.unit); });

    var shadow = [[], [], []];
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var u = e.battlefield[r][c];
        if (u) {
          shadow[c].push({
            row: r, hp: E.hpLeft(u), atk: E.atkOf(u), siege: E.cardOf(u).siege,
            guard: E.guardValue(state, u)
          });
        }
      }
    }
    shadow.forEach(function (list) { list.sort(function (a, b) { return a.row - b.row; }); });

    var myHp = {};
    var myGuard = {};
    ready.forEach(function (x) {
      myHp[x.unit.uid] = E.hpLeft(x.unit);
      myGuard[x.unit.uid] = E.guardValue(state, x.unit);
    });

    var chosen = [];
    for (var i = 0; i < ready.length; i++) {
      var x = ready[i];
      var inst = x.unit;
      var def = E.cardOf(inst);
      var myAtk = E.atkOf(inst);
      var list = shadow[x.col];
      var hp = myHp[inst.uid];
      var guard = myGuard[inst.uid] || 0;

      if (!list.length) {
        chosen.push(inst.uid);
        continue;
      }
      var d = list[0];
      var myDmg = Math.max(0, myAtk - (d.guard || 0));
      var dmgBack = Math.max(0, d.atk - guard);
      var kill = myDmg >= d.hp;
      var die = dmgBack >= hp;
      var lastDef = list.length === 1;
      var remaining = 0;
      for (var j = i + 1; j < ready.length; j++) {
        if (ready[j].col === x.col) { remaining++; }
      }
      var openLane = kill && lastDef && remaining > 0;
      var attack;

      if (!kill && die) {
        attack = false;
      } else if (!kill && !die) {
        attack = true; // 白赚伤害
      } else if (kill && !die) {
        attack = true;
      } else {
        var myVal = def.atk + def.siege + hp * 0.8;
        var dVal = d.atk + d.siege + d.hp * 0.8;
        attack = openLane || dVal >= myVal * 0.72;
      }

      if (attack) {
        chosen.push(inst.uid);
        d.hp -= myDmg;
        if (d.hp <= 0) { list.shift(); }
        myHp[inst.uid] = hp - dmgBack;
      }
    }
    return chosen;
  }

  return {
    mulligan: mulligan,
    chooseDeputyBonus: chooseDeputyBonus,
    nextPrepAction: nextPrepAction,
    planAttackers: planAttackers,
    chooseDomestic: chooseDomestic,
    choosePlay: choosePlay
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = SanguoAI; }
