/* =========================================================
 * 三国 · 战阵  ——  网页界面与流程控制
 * ========================================================= */
(function () {
  'use strict';

  var D = SanguoData;
  var E = SanguoEngine;
  var AI = SanguoAI;

  var ROW_NAMES = ['先锋', '中军', '后卫'];
  var PHASE_NAMES = { mulligan: '调度阶段', prep: '整备阶段', battle: '战斗阶段', cleanup: '修整阶段', gameover: '对局结束' };
  var SPEEDS = [1, 2, 4];

  var UI = {
    state: null,
    screen: 'menu',
    deckId: 'han',
    aiDeckId: 'huangjin',
    deputyId: 'liubei',
    selectedUid: null,
    spellUid: null,
    attackers: [],
    busy: false,
    speedIdx: 0,
    speed: 1,
    mulliganPicks: [],
    overShown: false,
    starting: false,
    epoch: 0,
    animUid: null,
    tipUid: null,
    logLen: 0
  };

  /* ---------------- 基础工具 ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function attrClass(a) { return { '步': 'bu', '弓': 'gong', '骑': 'qi', '谋': 'mou' }[a] || 'bu'; }
  function campClass(c) { return c === '蜀' ? 'shu' : (c === '魏' ? 'wei' : (c === '黄巾' ? 'huangjin' : (c === '汉' ? 'han' : 'none'))); }
  function attrText(d) {
    var as = (d.attrs && d.attrs.length) ? d.attrs : [d.attr];
    return as.join('');
  }
  function attrMulti(d) { return (d.attrs && d.attrs.length > 1); }
  function sleep(ms) {
    return new Promise(function (r) {
      setTimeout(r, Math.max(30, ms / UI.speed));
    });
  }
  function costText(cost) {
    var parts = [];
    if (cost.generic) { parts.push(cost.generic + '任意'); }
    D.ATTRS.forEach(function (a) {
      for (var i = 0; i < (cost[a] || 0); i++) { parts.push(a); }
    });
    return parts.length ? parts.join('+') : '0';
  }
  function pipsHtml(cost) {
    var h = '';
    if (cost.generic) { h += '<span class="pip generic">' + cost.generic + '</span>'; }
    D.ATTRS.forEach(function (a) {
      for (var i = 0; i < (cost[a] || 0); i++) {
        h += '<span class="pip ' + attrClass(a) + '">' + a + '</span>';
      }
    });
    return h;
  }
  function costBadgeHtml(cost) {
    var h = '';
    if (cost.generic) { h += '<span class="cost-num">' + cost.generic + '</span>'; }
    D.ATTRS.forEach(function (a) {
      for (var i = 0; i < (cost[a] || 0); i++) {
        h += '<span class="cost-pip attr-' + attrClass(a) + '">' + a + '</span>';
      }
    });
    return h;
  }
  function manaPillsHtml(p) {
    var m = E.manaBreakdown(p);
    var h = '<span class="mana-total">' + m.total + '</span>';
    D.ATTRS.forEach(function (a) {
      if (m[a] > 0) {
        h += '<span class="mana-orb attr-' + attrClass(a) + '">' + a + m[a] + '</span>';
      }
    });
    return h;
  }
  function toast(msg, type) {
    var d = document.createElement('div');
    d.className = 'toast ' + (type || '');
    d.textContent = msg;
    $('#toastRoot').appendChild(d);
    setTimeout(function () { d.classList.add('fade'); }, 1800);
    setTimeout(function () { d.remove(); }, 2200);
  }
  function instByUid(uid) {
    var s = UI.state;
    if (!s) { return null; }
    for (var i = 0; i < 2; i++) {
      var p = s.players[i];
      var pool = p.hand.concat(p.domestic, p.graveyard, E.allUnits(p));
      for (var j = 0; j < pool.length; j++) {
        if (pool[j].uid === uid) { return pool[j]; }
      }
    }
    return null;
  }
  function humanCanAct() {
    var s = UI.state;
    return !!s && s.winner === null && s.active === 0 && !UI.busy &&
      (s.phase === 'prep' || s.phase === 'cleanup');
  }
  function isBattleDeclaration() {
    var s = UI.state;
    return !!s && s.winner === null && s.active === 0 && s.phase === 'battle' && !s.battle && !UI.busy;
  }

  /* ---------------- 渲染：卡牌 ---------------- */
  function cardHtml(inst, opts) {
    opts = opts || {};
    var d = D.cards[inst.defId];
    var cls = ['card', 'faction-' + d.faction];
    if (d.category === '谋略') { cls.push('spell'); }
    if (d.legendary) { cls.push('legendary'); }
    if (opts.selected) { cls.push('selected'); }
    if (opts.unaffordable) { cls.push('unaffordable'); }
    if (opts.mull) { cls.push('mull-out'); }
    if (opts.pop) { cls.push('pop'); }
    var marks = '';
    if (inst.isDeputy) { marks += '<span class="mark-deputy">副</span>'; }
    var flavorHtml = d.effect
      ? '<span class="kw">' + esc(d.effect.kw || '登场') + '</span>' + esc(d.effect.short)
      : esc(d.text);
    return '<div class="' + cls.join(' ') + '" data-uid="' + inst.uid + '">' +
      '<div class="card-top">' +
        '<span class="card-corner">' +
          '<span class="attr-mark attr-' + attrClass(d.attr) + (attrMulti(d) ? ' attr-multi' : '') + '">' + esc(attrText(d)) + '</span>' +
          '<span class="camp-mark camp-' + campClass(d.camp) + '">' + esc(d.camp) + '</span>' +
        '</span>' +
        '<span class="name-wrap">' + marks + esc(d.name) + '</span>' +
        '<span class="cost-badge">' + costBadgeHtml(d.cost) + '</span>' +
      '</div>' +
      '<div class="c-art">' + esc(d.name) + '</div>' +
      '<div class="c-flavor">' + flavorHtml + '</div>' +
      '<div class="c-bottom">' +
        '<span class="c-stat atk"><b>' + (d.atk + (inst.bonusAtk || 0)) + '</b><i>攻</i></span>' +
        '<span class="c-stat siege"><b>' + d.siege + '</b><i>城</i></span>' +
        '<span class="c-stat hp"><b>' + (d.hp + (inst.bonusHp || 0)) + '</b><i>血</i></span>' +
      '</div>' +
    '</div>';
  }

  function unitHtml(u, owner) {
    var d = D.cards[u.defId];
    var s = UI.state;
    var cur = Math.max(0, E.maxHp(u) - u.damage);
    var max = E.maxHp(u);
    var summonNow = u.summonTurn === s.turnNumber;
    var cls = ['unit', 'faction-' + d.faction];
    if (summonNow) { cls.push('sleeping'); }
    if (isBattleDeclaration() && owner === 0 && !summonNow) { cls.push('ready'); }
    if (UI.attackers.indexOf(u.uid) >= 0) { cls.push('attacking'); }
    if (UI.animUid === u.uid) { cls.push('pop'); }
    var hpCls = 'u-stat hp' + (cur <= 2 ? ' critical' : (u.damage > 0 ? ' hurt' : ''));
    var guard = E.guardValue(s, u);
    var flavorHtml = d.effect
      ? '<span class="kw">' + esc(d.effect.kw || '登场') + '</span>' + esc(d.effect.short)
      : esc(d.text);
    return '<div class="' + cls.join(' ') + '" data-uid="' + u.uid + '" data-owner="' + owner + '">' +
      '<div class="u-top">' +
        '<span class="u-corner">' +
          '<span class="u-attr attr-' + attrClass(d.attr) + (attrMulti(d) ? ' attr-multi' : '') + '">' + esc(attrText(d)) + '</span>' +
          '<span class="u-camp camp-' + campClass(d.camp) + '">' + esc(d.camp) + '</span>' +
        '</span>' +
        (guard ? '<span class="u-guard">减' + guard + '</span>' : '') +
        '<span class="u-name">' + esc(d.name) +
          (u.isDeputy ? '<span class="u-deputy">副</span>' : '') +
          (summonNow ? '<span class="u-new">新</span>' : '') +
        '</span>' +
      '</div>' +
      '<div class="u-flavor">' + flavorHtml + '</div>' +
      '<div class="u-bottom">' +
        '<span class="u-stat atk"><b>' + E.atkOf(u) + '</b><i>攻</i></span>' +
        '<span class="u-stat siege"><b>' + E.siegeOf(s, u) + '</b><i>城</i></span>' +
        '<span class="' + hpCls + '"><b>' + (cur === max ? max : cur + '/' + max) + '</b><i>血</i></span>' +
      '</div>' +
    '</div>';
  }

  function domCardHtml(u) {
    var d = D.cards[u.defId];
    return '<div class="dom-card ' + (u.tapped ? 'tapped' : '') + '" data-uid="' + u.uid + '">' +
      '<span class="dc-name">' + esc(d.name) + '</span>' +
      '<span class="dc-attr attr-' + attrClass(d.attr) + (attrMulti(d) ? ' attr-multi' : '') + '">' + esc(attrText(d)) + '</span>' +
    '</div>';
  }

  /* ---------------- 渲染：棋盘 ---------------- */
  function heroHtml(owner) {
    var s = UI.state;
    var p = s.players[owner];
    var deck = D.getDeck(p.deckId);
    var deputy = p.deputyId ? D.cards[p.deputyId] : null;
    var hp = Math.max(0, p.hero.hp);
    var pct = Math.max(0, Math.min(100, hp / p.hero.maxHp * 100));
    var active = s.active === owner && s.winner === null;
    var untapped = p.domestic.filter(function (u) { return !u.tapped; }).length;
    return '<div class="hero ' + (active ? 'turn-active' : '') + '" id="hero-' + owner + '">' +
      '<div class="hero-avatar">' + esc(p.hero.name[0]) + '</div>' +
      '<div class="hero-main">' +
        '<div class="hero-name">' + esc(p.hero.name) + ' <span>' + esc(p.hero.title) + '</span></div>' +
        '<div class="hero-deck">主将 · ' + esc(deck.name) + ' · 副将 ' + esc(deputy ? deputy.name : '—') + '</div>' +
        '<div class="hero-hp-row">' +
          '<div class="hp-track"><div class="hp-fill ' + (pct <= 35 ? 'low' : '') + '" style="width:' + pct + '%"></div></div>' +
          '<div class="hero-hp-num">' + hp + '<em>/' + p.hero.maxHp + '</em></div>' +
        '</div>' +
      '</div>' +
      '<div class="hero-piles">' +
        '<span>牌库 <b>' + p.deck.length + '</b></span>' +
        '<span>墓地 <b>' + p.graveyard.length + '</b></span>' +
        '<span>手牌 <b>' + p.hand.length + '</b></span>' +
        '<span>内政 <b>' + untapped + '/' + p.domestic.length + '</b></span>' +
      '</div>' +
    '</div>';
  }

  function domesticRowHtml(owner) {
    var s = UI.state;
    var p = s.players[owner];
    var dispatchable = owner === 0 && !p.focusUsed && !!UI.selectedUid && humanCanAct();
    var hint;
    if (owner === 0) {
      hint = p.focusUsed ? '本回合已派遣' : '点击此处派遣 · 横置产费';
    } else {
      hint = '横置产费 · 电脑内政区';
    }
    var cards = p.domestic.map(domCardHtml).join('');
    if (!p.domestic.length) { cards = '<span class="dom-empty">尚无内政将领</span>'; }
    return '<div class="domestic-row ' + (dispatchable ? 'dispatchable' : '') + '" data-owner="' + owner + '" data-role="domestic">' +
      '<div class="dom-label">内政区</div>' +
      '<div class="dom-cards">' + cards + '</div>' +
      '<div class="dom-hint">' + hint + '</div>' +
    '</div>';
  }

  function selectedAffordable() {
    var s = UI.state;
    if (!s || !UI.selectedUid) { return false; }
    var p = s.players[0];
    for (var i = 0; i < p.hand.length; i++) {
      if (p.hand[i].uid === UI.selectedUid) { return E.canPay(p, D.cards[p.hand[i].defId].cost); }
    }
    return false;
  }

  function cellHtml(owner, row, col) {
    var s = UI.state;
    var u = s.players[owner].battlefield[row][col];
    var cls = ['cell'];
    if (!u && owner === 0 && UI.selectedUid && humanCanAct() && selectedAffordable()) { cls.push('valid-target'); }
    if (u && owner === 0 && isBattleDeclaration()) { cls.push('selectable'); }
    return '<div class="' + cls.join(' ') + '" data-owner="' + owner + '" data-row="' + row + '" data-col="' + col + '">' +
      (u ? unitHtml(u, owner) : '') +
    '</div>';
  }

  function fieldRowHtml(owner) {
    var order = owner === 1 ? [2, 1, 0] : [0, 1, 2];
    var labels = order.map(function (r) { return '<span>' + ROW_NAMES[r] + '</span>'; }).join('');
    var cells = '';
    order.forEach(function (r) {
      for (var c = 0; c < 3; c++) { cells += cellHtml(owner, r, c); }
    });
    return '<div class="field-row"><div class="row-labels">' + labels + '</div><div class="field">' + cells + '</div></div>';
  }

  function renderZone(owner) {
    var parts = [
      '<div class="zone-head">' + heroHtml(owner) + '</div>',
      domesticRowHtml(owner),
      fieldRowHtml(owner)
    ];
    if (owner === 0) { parts.reverse(); }
    var el = document.getElementById(owner === 0 ? 'humanZone' : 'aiZone');
    el.innerHTML = parts.join('');
  }

  /* ---------------- 渲染：手牌 / 控制 ---------------- */
  function renderHand() {
    var s = UI.state;
    var p = s.players[0];
    var html = p.hand.map(function (inst) {
      var d = D.cards[inst.defId];
      var pay = E.canPay(p, d.cost);
      return cardHtml(inst, {
        selected: UI.selectedUid === inst.uid || UI.spellUid === inst.uid,
        unaffordable: !pay
      });
    }).join('');
    $('#handArea').innerHTML = html || '<div class="hand-empty">手牌已空 · 等待抓牌</div>';

    var hint = '';
    if (s.winner !== null) {
      hint = '对局结束';
    } else if (s.active !== 0) {
      hint = '电脑的回合 · 手牌暂不可用';
    } else if (s.phase === 'battle') {
      hint = s.battle ? '战斗结算中…' : '战斗阶段 · 点击我方将领切换进攻标记';
    } else if (UI.spellUid) {
      hint = '已选择谋略牌 · 点击一名我方单位作为目标';
    } else if (UI.selectedUid) {
      var inst = null;
      for (var i = 0; i < p.hand.length; i++) { if (p.hand[i].uid === UI.selectedUid) { inst = p.hand[i]; break; } }
      if (inst) {
        var d = D.cards[inst.defId];
        var pay = E.canPay(p, d.cost);
        hint = '已选择「' + esc(d.name) + '」 · 费用 ' + costText(d.cost) + ' · ' +
          (pay ? '<b>点击空格布阵</b>，或点击内政区派遣' : '<b class="red">内政费用不足</b>');
      }
    } else {
      hint = '点击手牌选择卡牌 · 选中后点击战场空格布阵 · 谋略牌点击直接使用';
    }
    $('#handHint').innerHTML = hint;
  }

  function renderControls() {
    var s = UI.state;
    var el = $('#controls');
    var isHuman = s.active === 0;
    var ready = E.readyUnits(s.players[0], s.turnNumber);
    var html = '<div class="ctrl-top">' +
      '<span class="ctrl-turn ' + (isHuman ? '' : 'ai') + '">' + (isHuman ? '你的回合' : '电脑回合') + '</span>' +
      '<span class="ctrl-phase">' + (PHASE_NAMES[s.phase] || '') + '</span>' +
    '</div>';

    var hint = '';
    var buttons = '';
    if (s.winner !== null) {
      hint = '对局已经结束。';
    } else if (!isHuman) {
      hint = '电脑正在行动，请稍候…';
    } else if (UI.busy) {
      hint = '正在结算，请稍候…';
    } else if (s.phase === 'prep') {
      if (UI.spellUid) {
        hint = '已选择谋略牌：点击一名<b>我方单位</b>作为目标。';
      } else if (UI.selectedUid) {
        hint = '点击战场空格布阵，或点击内政区派遣。';
      } else if (!ready.length) {
        hint = '本回合没有可进攻的单位（新登场需等待一回合）· 可派遣内政或出牌。';
      } else {
        hint = '可派遣 <b>1</b> 张手牌进入内政区，并支付费用打出任意手牌。';
      }
      buttons = '<button class="btn btn-primary" data-cmd="battle">' + (ready.length ? '进入战斗' : '进入修整') + '</button>';
    } else if (s.phase === 'battle') {
      if (s.battle) {
        hint = '战斗结算中…';
      } else {
        hint = '已选 <b>' + UI.attackers.length + '</b> 个进攻单位 · 本回合新登场的单位不能进攻。';
        buttons = '<button class="btn" data-cmd="all">全选</button>' +
          '<button class="btn" data-cmd="clear">清空</button>' +
          '<button class="btn btn-primary" data-cmd="attack">' + (UI.attackers.length ? '发动进攻' : '跳过进攻') + '</button>';
      }
    } else if (s.phase === 'cleanup') {
      hint = '修整阶段：可继续出牌，然后结束回合。';
      buttons = '<button class="btn btn-primary" data-cmd="endturn">结束回合</button>';
    }

    html += '<div class="ctrl-hint">' + hint + '</div>';
    if (isHuman && s.winner === null) {
      html += '<div class="ctrl-mana">内政费用 ' + manaPillsHtml(s.players[0]) + '</div>';
    }
    if (buttons) { html += '<div class="ctrl-btns">' + buttons + '</div>'; }
    el.innerHTML = html;
  }

  function renderTopbar() {
    var s = UI.state;
    var isHuman = s.active === 0;
    var txt = s.active === 0 ? '<span class="tb-me">你的回合</span>' : '<span class="tb-ai">电脑的回合</span>';
    if (s.winner !== null) {
      txt = '<span class="tb-me">' + (s.winner === 0 ? '你获胜了' : '电脑获胜') + '</span>';
    }
    $('#turnBadge').innerHTML = '第 ' + Math.ceil(s.turnNumber / 2) + ' 回合 · ' + txt + ' · ' + (PHASE_NAMES[s.phase] || '');
    $('#speedBtn').textContent = '动画 ' + UI.speed + 'x';
  }

  function renderLog() {
    var s = UI.state;
    var list = $('#logList');
    var atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 50;
    list.innerHTML = s.log.map(function (x) {
      return '<div class="log-entry ' + x.cls + '">' + esc(x.text) + '</div>';
    }).join('');
    $('#logCount').textContent = '第 ' + Math.ceil(s.turnNumber / 2) + ' 回合';
    if (atBottom) { list.scrollTop = list.scrollHeight; }
  }

  function renderAll() {
    if (!UI.state) { return; }
    renderTopbar();
    renderZone(1);
    renderZone(0);
    renderHand();
    renderControls();
    renderLog();
  }

  /* ---------------- 主菜单 ---------------- */
  function renderMenu() {
    var deck = D.getDeck(UI.deckId);
    if (!deck) { UI.deckId = D.decks[0].id; deck = D.decks[0]; }
    var legend = D.legendariesOf(deck);
    var ids = legend.map(function (c) { return c.id; });
    if (ids.indexOf(UI.deputyId) < 0) {
      UI.deputyId = deck.recommendedDeputy;
    }
    UI.aiDeckId = (D.decks.filter(function (d) { return d.id !== UI.deckId; })[0] || D.decks[0]).id;
    var aiDeck = D.getDeck(UI.aiDeckId);

    $('#deckSelect').innerHTML = D.decks.map(deckPanelHtml).join('');
    $('#deputyList').innerHTML = legend.map(function (c) {
      return '<button class="deputy-chip ' + (UI.deputyId === c.id ? 'selected' : '') + '" data-deputy="' + c.id + '">' +
        '<span class="dc-cost">' + D.costTotal(c.cost) + '</span>' +
        '<span class="dc-name">' + esc(c.name) + '</span>' +
        '<span class="dc-stats">攻' + c.atk + ' 城' + c.siege + ' 血' + c.hp + '</span>' +
      '</button>';
    }).join('');
    $('#deputyHint').innerHTML = '副将登场时，可选择 +1 攻击力 或 +1 生命值 · 电脑将使用 <b style="color:#c9b98f">' +
      esc(aiDeck.name) + '</b>（副将 ' + esc(D.cards[aiDeck.recommendedDeputy].name) + '）';
  }

  function deckPanelHtml(deck) {
    var st = D.deckStats(deck);
    var legend = D.legendariesOf(deck);
    var legendIds = {};
    legend.forEach(function (c) { legendIds[c.id] = true; });
    var rows = {};
    deck.cards.forEach(function (e) {
      if (!rows[e.id]) { rows[e.id] = { id: e.id, count: 0 }; }
      rows[e.id].count += e.count;
    });
    var rowArr = Object.keys(rows).map(function (id) {
      var c = D.cards[id];
      return { card: c, count: rows[id].count, total: D.costTotal(c.cost) };
    }).sort(function (a, b) {
      if (a.total !== b.total) { return a.total - b.total; }
      if (a.card.legendary !== b.card.legendary) { return a.card.legendary ? -1 : 1; }
      return a.card.name.localeCompare(b.card.name, 'zh');
    });
    var maxAttr = Math.max.apply(null, D.ATTRS.map(function (a) { return st.attr[a]; }));
    var bars = D.ATTRS.map(function (a) {
      return '<div class="attr-bar"><div class="ab-top"><span>' + a + '</span><b>' + st.attr[a] + '</b></div>' +
        '<div class="ab-track"><div class="ab-fill ' + attrClass(a) + '" style="width:' + (st.attr[a] / maxAttr * 100) + '%"></div></div></div>';
    }).join('');
    var list = rowArr.map(function (r) {
      var c = r.card;
      var isLeg = !!legendIds[c.id];
      return '<div class="deck-row ' + (isLeg ? 'legendary' : '') + '">' +
        '<span class="num">' + r.total + '</span>' +
        '<span class="deck-attr attr-' + attrClass(c.attr) + '">' + c.attr + '</span>' +
        '<b>' + esc(c.name) + '</b>' +
        (c.effect ? '<span class="deck-kw">' + esc((c.effect.kw || '效果').charAt(0)) + '</span>' : '') +
        '<span class="mini-stats">' + c.atk + '/' + c.siege + '/' + c.hp + '</span>' +
        '<span class="x">×' + r.count + '</span>' +
      '</div>';
    }).join('');

    return '<div class="deck-panel ' + deck.faction + ' ' + (UI.deckId === deck.id ? 'selected' : '') + '" data-deck="' + deck.id + '">' +
      '<div class="deck-banner">' +
        '<div class="deck-seal">' + (deck.faction === 'shu' ? '蜀' : (deck.faction === 'wei' ? '魏' : (deck.faction === 'han' ? '汉' : '黄'))) + '</div>' +
        '<div class="deck-title"><h2>' + esc(deck.name) + '</h2><span class="deck-style">' + esc(deck.style) + '</span></div>' +
        '<div class="deck-check">✓</div>' +
      '</div>' +
      '<p class="deck-desc">' + esc(deck.desc) + '</p>' +
      '<div class="deck-meta"><span>' + st.total + ' 张</span><span>传奇 ' + st.legendary + '</span><span>普通 ' + st.normal +
        '</span><span>平均费用 ' + st.avgCost.toFixed(1) + '</span><span>数值 攻/城/血</span>' +
        (deck.status === '草稿' ? '<span class="deck-draft">草稿</span>' : '') + '</div>' +
      '<div class="attr-title">兵权分布</div>' +
      '<div class="attr-bars">' + bars + '</div>' +
      '<div class="deck-list">' + list + '</div>' +
      '<div class="deck-list-foot">共 ' + rowArr.length + ' 种 · ' + st.total + ' 张 · 列表可滚动</div>' +
    '</div>';
  }

  function selectDeck(id) {
    if (UI.deckId === id) { return; }
    UI.deckId = id;
    var deck = D.getDeck(id);
    UI.deputyId = deck.recommendedDeputy;
    renderMenu();
  }
  function selectDeputy(id) {
    var deck = D.getDeck(UI.deckId);
    var ids = D.legendariesOf(deck).map(function (c) { return c.id; });
    if (ids.indexOf(id) < 0) { return; }
    UI.deputyId = id;
    renderMenu();
  }

  /* ---------------- 弹窗 ---------------- */
  function openModal(html) {
    var root = $('#modalRoot');
    root.innerHTML = '<div class="modal-backdrop">' + html + '</div>';
    return root.querySelector('.modal');
  }
  function closeModal() { $('#modalRoot').innerHTML = ''; }

  function confirmModal(title, text) {
    return new Promise(function (resolve) {
      var m = openModal('<div class="modal modal-sm">' +
        '<div class="modal-head"><h3>' + esc(title) + '</h3><p>' + text + '</p></div>' +
        '<div class="modal-actions"><button class="btn" data-x="no">取消</button>' +
        '<button class="btn btn-primary" data-x="yes">确定</button></div>' +
      '</div>');
      $$('[data-x]', m).forEach(function (b) {
        b.addEventListener('click', function () {
          closeModal();
          resolve(b.getAttribute('data-x') === 'yes');
        });
      });
    });
  }

  function showRules() {
    var hpA = SanguoData.decks[0].hero.hp;
    var hpB = (SanguoData.decks[1] || SanguoData.decks[0]).hero.hp;
    var hpText = hpA === hpB ? (hpA + ' 点') : (hpA + ' / ' + hpB + ' 点');
    var m = openModal('<div class="modal">' +
      '<button class="modal-close" data-close="1">×</button>' +
      '<div class="modal-head"><h3>规则说明 · Demo v1.4</h3><p>依据《三国卡牌游戏》设计文档实现，并标注了文档未明确处的 Demo 判定。</p></div>' +
      '<div class="rules-body">' +
        '<h4>一、胜负与组件</h4>' +
        '<p>每位玩家由 <b>1 名主将</b>（独立实体，' + hpText + '血量，主将无技能）、<b>1 名副将</b>与牌组组成（汉军、黄巾当前均为 <b>20 张 / 8 传奇草稿</b>）。传奇将领在套牌中只能放 1 张；副将从套牌内的传奇将领中选择。</p>' +
        '<p>将敌方主将血量降到 0 即获胜；我方主将归零则失败。</p>' +
        '<h4>二、回合流程</h4>' +
        '<ul>' +
          '<li><b>抓牌阶段</b>：从牌库顶抓 1 张。先手玩家第一回合不抓牌。</li>' +
          '<li><b>整备阶段</b>：可从手牌派遣 1 张牌进入内政区（与修整阶段共用次数）；可支付费用打出任意数量手牌。</li>' +
          '<li><b>战斗阶段</b>：选择任意数量可进攻的单位（当回合登场的不能进攻），宣告后结算。</li>' +
          '<li><b>修整阶段</b>：内容与整备阶段相同；结束此阶段后轮到对手。</li>' +
        '</ul>' +
        '<h4>三、内政与费用</h4>' +
        '<p>内政区的将领或部队可横置，产出 1 点对应兵权（步 / 弓 / 骑 / 谋）的费用；一张牌若写有多种兵权（如 <b>弓/骑</b>），横置时由系统自动选择其中一种，<b>只产 1 点</b>。兵权即文档中的「内政属性」。费用结构如 <b>[2][步][步]</b> 表示 2 点任意费用 + 2 点步兵权费用。我方回合开始时，内政区单位全部重置。</p>' +
        '<h4>四、战斗</h4>' +
        '<p>从 [1 排 1 列] 开始，<b>从前向后、每排从左至右</b>依次结算。每个进攻单位攻击<b>同列最靠前的敌方单位</b>；若该列没有敌方单位，则对敌方主将造成其<b>攻城值</b>伤害。交战双方同时互相造成等同于攻击力的伤害；累计伤害 ≥ 生命值即阵亡。</p>' +
        '<h4>五、调度</h4>' +
        '<p>起手 6 张。随机决定一名玩家拥有先后手决定权，由该玩家选择自己先手或后手。随后双方依次调度：将任意数量手牌置于牌库底，抓取等量牌，然后洗牌。</p>' +
        '<h4>六、副将</h4>' +
        '<p>副将登场时，可选择 +1 攻击力或 +1 生命值。若被派遣至内政区，则不触发该加成。</p>' +
        '<h4>七、触发与关键词</h4>' +
        '<p>卡牌文本用 <b>[触发] [效果ID, 参数...]</b> 引用「效果表」：</p>' +
        '<ul>' +
          '<li><b>[条件:N黄巾]</b>：我方其他黄巾 ≥ N 时，后续效果才触发（阵营可换）。</li>' +
          '<li><b>登场 / 进攻时 / 亡语</b>：分别在打入战场、宣告进攻、死亡时触发。</li>' +
          '<li><b>先锋 / 中军 / 后卫</b>：卡牌在对应排时才生效（可与触发组合，如「中军·登场」）。</li>' +
          '<li><b>四格光环</b>：黄巾战棋在场时，前后左右四格我方黄巾 +1/+1。</li>' +
          '<li><b>谋略</b>：点击手牌使用，不进入战场，结算后进墓地；带目标的谋略（如举盾）需再点一名我方单位。</li>' +
          '<li><b>贯穿</b>：击杀后溢出伤害打同列后续单位，穿透伤害不攻城。</li>' +
          '<li><b>敏捷</b>：进攻时先结算伤害，击杀目标则不受反击。</li>' +
          '<li><b>守军</b>：不能主动进攻，只能防守反击。</li>' +
          '<li><b>抵抗</b>：本回合获得减伤（与步兵减伤同用 guard 字段）。</li>' +
          '<li><b>相邻 / 整排增益</b>：进场时只影响当时在场的我方单位。</li>' +
          '<li><b>鼓舞</b>：进攻时让下一个进攻的将领永久 +1 攻。</li>' +
          '<li><b>进攻免伤 / 攻城+1 / 行攻城</b>：满足条件时生效。</li>' +
        '</ul>' +
        '<div class="note">' +
          '<b>Demo 判定说明（文档未明确处）：</b>' +
          '<ul>' +
            '<li>文档同时提到「主将血量」与「城池」：Demo 将二者合并为一条 ' + hpText + ' 的主将 / 城池耐久。</li>' +
            '<li>内政区单位不参与战斗、不可被攻击；只有战场上的单位能进攻或被攻击。</li>' +
            '<li>战斗顺序按「从前向后、每排从左至右」执行。</li>' +
            '<li>内政将领当回合派遣后可立即横置产费。</li>' +
            '<li>将领受到的伤害会保留，不会自动治疗。</li>' +
            '<li>Demo 补充：牌库耗尽后，抓牌改为受到 1 点疲劳伤害，避免无限僵局。</li>' +
            '<li>带触发标签（登场/进攻时/亡语/静态/谋略/行）的卡牌有实际效果；其余文本框为风味描述。</li>' +
          '</ul>' +
        '</div>' +
        '<h4>八、操作</h4>' +
        '<p>点击手牌选中，再点击战场空格布阵；选中手牌后点击内政区可派遣。谋略牌点击直接使用（带目标的谋略再点一名我方单位）；战斗阶段点击我方单位切换进攻标记，再点击「发动进攻」结算。</p>' +
      '</div>' +
      '<div class="modal-actions"><button class="btn btn-primary" data-close="1">知道了</button></div>' +
    '</div>');
    $$('[data-close]', m).forEach(function (b) { b.addEventListener('click', closeModal); });
  }

  /* ---------------- 先后手 / 调度 ---------------- */
  function showCoinFlip() {
    return new Promise(function (resolve) {
      var human = 1 + Math.floor(Math.random() * 6);
      var ai = 1 + Math.floor(Math.random() * 6);
      while (ai === human) { ai = 1 + Math.floor(Math.random() * 6); }
      var chooser = human > ai ? 0 : 1;
      var m = openModal('<div class="modal modal-md">' +
        '<div class="modal-head"><h3>决定先后手</h3><p>双方掷骰，点数高者获得决定权，由该玩家决定自己使用先手还是后手。先手玩家的第一个回合不抓牌。</p></div>' +
        '<div class="dice-row">' +
          '<div class="dice-wrap"><div class="dice rolling" id="diceH">?</div><div class="dice-label">你</div></div>' +
          '<div class="dice-wrap"><div class="dice rolling" id="diceA">?</div><div class="dice-label">电脑</div></div>' +
        '</div>' +
        '<div id="coinResult" class="mulligan-info"></div>' +
        '<div id="coinActions" class="modal-actions"></div>' +
      '</div>');
      var tick = setInterval(function () {
        m.querySelector('#diceH').textContent = 1 + Math.floor(Math.random() * 6);
        m.querySelector('#diceA').textContent = 1 + Math.floor(Math.random() * 6);
      }, 70);
      setTimeout(function () {
        clearInterval(tick);
        m.querySelector('#diceH').textContent = human;
        m.querySelector('#diceA').textContent = ai;
        m.querySelector('#diceH').classList.remove('rolling');
        m.querySelector('#diceA').classList.remove('rolling');
        var result = m.querySelector('#coinResult');
        var actions = m.querySelector('#coinActions');
        if (chooser === 0) {
          result.innerHTML = '你以 <b>' + human + '</b> : <b>' + ai + '</b> 获得决定权。';
          actions.innerHTML = '<button class="btn" data-first="1">我要后手</button>' +
            '<button class="btn btn-primary" data-first="0">我要先手</button>';
          $$('[data-first]', actions).forEach(function (b) {
            b.addEventListener('click', function () {
              var first = Number(b.getAttribute('data-first'));
              closeModal();
              resolve(first);
            });
          });
        } else {
          var aiGoFirst = UI.aiDeckId === 'han';
          result.innerHTML = '电脑以 <b>' + ai + '</b> : <b>' + human + '</b> 获得决定权…';
          actions.innerHTML = '<button class="btn" disabled>电脑正在决定…</button>';
          setTimeout(function () {
            result.innerHTML = '电脑决定使用 <b>' + (aiGoFirst ? '先手' : '后手') + '</b>。';
            actions.innerHTML = '<button class="btn btn-primary" data-ok="1">开始调度</button>';
            actions.querySelector('[data-ok]').addEventListener('click', function () {
              closeModal();
              resolve(aiGoFirst ? 1 : 0);
            });
          }, 850);
        }
      }, 950);
    });
  }

  function showMulligan() {
    return new Promise(function (resolve) {
      var s = UI.state;
      UI.mulliganPicks = [];
      var m = openModal('<div class="modal">' +
        '<div class="modal-head"><h3>调度阶段</h3>' +
          '<p>可将任意数量手牌置于牌库底，再抓取等量牌，然后洗牌。先手：<b style="color:#e8ca82">' +
          (s.firstPlayer === 0 ? '你' : '电脑') + '</b>。</p></div>' +
        '<div class="mulligan-hand">' + s.players[0].hand.map(function (u) {
          return '<div class="mull-item">' + cardHtml(u, {}) + '<span class="mull-mark">换</span></div>';
        }).join('') + '</div>' +
        '<div class="mulligan-info"><span>点击手牌选择换掉的牌</span><span>已选择 <b id="mullCount">0</b> 张</span></div>' +
        '<div class="modal-actions"><button class="btn" id="mullKeep">保留全部</button>' +
        '<button class="btn btn-primary" id="mullConfirm">确认调度</button></div>' +
      '</div>');
      $$('.mulligan-hand .mull-item', m).forEach(function (item) {
        item.addEventListener('click', function () {
          var card = item.querySelector('.card');
          var uid = card.getAttribute('data-uid');
          var i = UI.mulliganPicks.indexOf(uid);
          if (i >= 0) { UI.mulliganPicks.splice(i, 1); } else { UI.mulliganPicks.push(uid); }
          item.classList.toggle('mull-out');
          m.querySelector('#mullCount').textContent = UI.mulliganPicks.length;
        });
      });
      function finish(picks) {
        var aiPicks = AI.mulligan(s, 1);
        E.mulligan(s, { 0: picks, 1: aiPicks });
        closeModal();
        renderAll();
        resolve();
        if (s.winner !== null) {
          showGameOver();
        } else if (s.active === 1) {
          runAITurn();
        }
      }
      m.querySelector('#mullKeep').addEventListener('click', function () { finish([]); });
      m.querySelector('#mullConfirm').addEventListener('click', function () {
        finish(UI.mulliganPicks.slice());
      });
    });
  }

  function showDeputyChoice() {
    return new Promise(function (resolve) {
      var s = UI.state;
      var pend = s.pending;
      if (!pend) { resolve(); return; }
      var p = s.players[pend.playerIndex];
      var found = E.findOnBoard(p, pend.uid);
      var m = openModal('<div class="modal modal-sm">' +
        '<div class="modal-head"><h3>副将登场</h3><p>' + esc(found ? E.cardOf(found.unit).name : '副将') + ' 以副将身份登场，选择一项永久加成。</p></div>' +
        '<div class="deputy-preview">' + (found ? cardHtml(found.unit, {}) : '') + '</div>' +
        '<div class="choice-row">' +
          '<button class="choice" data-choice="atk"><b>+1</b><span>攻击力</span></button>' +
          '<button class="choice" data-choice="hp"><b>+1</b><span>生命值</span></button>' +
        '</div>' +
      '</div>');
      $$('[data-choice]', m).forEach(function (b) {
        b.addEventListener('click', function () {
          E.applyDeputyBonus(s, b.getAttribute('data-choice'));
          closeModal();
          renderAll();
          resolve();
        });
      });
    });
  }

  /* ---------------- 游戏流程 ---------------- */
  function showScreen(name) {
    UI.screen = name;
    $('#menu').classList.toggle('hidden', name !== 'menu');
    $('#game').classList.toggle('hidden', name !== 'game');
  }

  function resetGameUI() {
    UI.epoch++;
    UI.state = null;
    UI.selectedUid = null;
    UI.attackers = [];
    UI.busy = false;
    UI.overShown = false;
    UI.animUid = null;
    UI.mulliganPicks = [];
    UI.tipUid = null;
    closeModal();
    clearFx();
    $('#tooltip').classList.remove('show');
  }

  async function beginMatchSetup() {
    resetGameUI();
    var first = await showCoinFlip();
    if (first === null) { return; }
    var seed = (Math.random() * 4294967295) >>> 0;
    var s = E.createGame({
      players: [
        { deckId: UI.deckId, deputyId: UI.deputyId, name: '你', isAI: false },
        { deckId: UI.aiDeckId, deputyId: D.getDeck(UI.aiDeckId).recommendedDeputy, name: '电脑', isAI: true }
      ],
      seed: seed,
      firstPlayer: first
    });
    UI.state = s;
    showScreen('game');
    renderAll();
    await showMulligan();
  }

  function returnToMenu() {
    UI.epoch++;
    UI.state = null;
    UI.screen = 'menu';
    UI.busy = false;
    UI.overShown = false;
    closeModal();
    clearFx();
    $('#logList').innerHTML = '';
    $('#handArea').innerHTML = '';
    $('#aiZone').innerHTML = '';
    $('#humanZone').innerHTML = '';
    $('#controls').innerHTML = '';
    showScreen('menu');
    renderMenu();
  }

  function showGameOver() {
    if (!UI.state || UI.state.winner === null || UI.overShown) { return; }
    UI.overShown = true;
    UI.busy = true;
    clearFx();
    var s = UI.state;
    var win = s.winner === 0;
    var rounds = Math.ceil(s.turnNumber / 2);
    var m = openModal('<div class="modal modal-sm">' +
      '<div class="over-seal ' + (win ? 'win' : 'lose') + '">' + (win ? '胜' : '败') + '</div>' +
      '<h2 class="over-title">' + (win ? '大 获 全 胜' : '折 戟 沉 沙') + '</h2>' +
      '<p class="over-sub">' + (win ? '敌方主将已被击破，城池易主。' : '主将血量归零，此战告负。') +
        '<br>共 ' + rounds + ' 回合</p>' +
      '<div class="over-stats">' +
        '<div><b>' + Math.max(0, s.players[0].hero.hp) + '</b><span>我方主将</span></div>' +
        '<div><b>' + Math.max(0, s.players[1].hero.hp) + '</b><span>敌方主将</span></div>' +
        '<div><b>' + s.players[0].graveyard.length + '</b><span>我方阵亡</span></div>' +
        '<div><b>' + s.players[1].graveyard.length + '</b><span>敌方阵亡</span></div>' +
      '</div>' +
      '<div class="modal-actions">' +
        '<button class="btn" data-over="menu">返回套牌</button>' +
        '<button class="btn btn-primary" data-over="again">再战一局</button>' +
      '</div>' +
    '</div>');
    m.querySelector('[data-over="again"]').addEventListener('click', function () {
      closeModal();
      beginMatchSetup();
    });
    m.querySelector('[data-over="menu"]').addEventListener('click', function () {
      closeModal();
      returnToMenu();
    });
  }

  /* ---------------- 人类操作 ---------------- */
  function onHandClick(uid) {
    var s = UI.state;
    if (!s || UI.busy || s.winner !== null || s.active !== 0) { return; }
    if (s.phase === 'battle') { toast('战斗阶段无法选择或打出手牌', 'warn'); return; }
    var p = s.players[0];
    var inst = null;
    for (var i = 0; i < p.hand.length; i++) { if (p.hand[i].uid === uid) { inst = p.hand[i]; break; } }
    if (inst && D.cards[inst.defId].category === '谋略') {
      if (D.cards[inst.defId].targeted) {
        UI.spellUid = UI.spellUid === uid ? null : uid;
        UI.selectedUid = null;
        if (UI.spellUid) { toast('已选择「' + D.cards[inst.defId].name + '」，请点击一名我方单位作为目标', 'info'); }
        renderAll();
        return;
      }
      tryPlay(uid, null, null);
      return;
    }
    UI.spellUid = null;
    UI.selectedUid = UI.selectedUid === uid ? null : uid;
    renderAll();
  }

  function onCellClick(owner, row, col) {
    var s = UI.state;
    if (!s || UI.busy || s.winner !== null || s.active !== 0) { return; }
    if (s.phase === 'battle' && !s.battle) {
      if (owner !== 0) { return; }
      var u = s.players[0].battlefield[row][col];
      if (!u) { return; }
      if (E.isTaunt(s, u)) { toast('守军单位不能主动进攻', 'warn'); return; }
      if (u.summonTurn >= s.turnNumber) { toast('本回合刚登场的将领无法进攻', 'warn'); return; }
      var i = UI.attackers.indexOf(u.uid);
      if (i >= 0) { UI.attackers.splice(i, 1); } else { UI.attackers.push(u.uid); }
      renderAll();
      return;
    }
    if (s.phase !== 'prep' && s.phase !== 'cleanup') { return; }
    if (UI.spellUid) {
      if (owner !== 0) { return; }
      var tu = s.players[0].battlefield[row][col];
      if (!tu) { toast('请选择一名我方单位', 'warn'); return; }
      var spell = UI.spellUid;
      UI.spellUid = null;
      tryPlay(spell, null, null, tu.uid);
      return;
    }
    if (!UI.selectedUid) { return; }
    if (owner !== 0) { return; }
    if (s.players[0].battlefield[row][col]) { toast('该格已有将领', 'warn'); return; }
    tryPlay(UI.selectedUid, row, col);
  }

  function onDomesticClick(owner) {
    if (owner !== 0) { return; }
    if (!humanCanAct()) { return; }
    if (!UI.selectedUid) { toast('请先选择一张手牌', 'warn'); return; }
    tryDeployDomestic(UI.selectedUid);
  }

  async function tryPlay(uid, row, col, targetUid) {
    var s = UI.state;
    var p = s.players[0];
    var inst = null;
    p.hand.forEach(function (u) { if (u.uid === uid) { inst = u; } });
    if (!inst) { return; }
    var d = D.cards[inst.defId];
    if (!E.canPay(p, d.cost)) {
      toast('内政费用不足：需要 ' + costText(d.cost) + '，当前内政可用 ' + E.manaBreakdown(p).total + ' 点', 'warn');
      return;
    }
    UI.busy = true;
    UI.spellUid = null;
    renderControls();
    try {
      E.playCard(s, uid, row, col, targetUid);
      UI.selectedUid = null;
      UI.animUid = uid;
      renderAll();
      setTimeout(function () { UI.animUid = null; }, 380);
      await sleep(260);
      if (s.pending) { await showDeputyChoice(); }
    } catch (err) {
      toast(err.message, 'warn');
    }
    UI.busy = false;
    renderAll();
  }

  async function tryDeployDomestic(uid) {
    var s = UI.state;
    var p = s.players[0];
    var inst = null;
    p.hand.forEach(function (u) { if (u.uid === uid) { inst = u; } });
    if (!inst) { return; }
    if (p.focusUsed) { toast('本回合已派遣过内政将领', 'warn'); return; }
    if (inst.isDeputy) {
      var ok = await confirmModal('派遣副将？', '将副将派遣至内政区会失去登场时的 +1 加成，且无法再作为战场将领登场。确定要派遣吗？');
      if (!ok) { return; }
    }
    try {
      E.deployDomestic(s, uid);
      UI.selectedUid = null;
      renderAll();
    } catch (err) {
      toast(err.message, 'warn');
    }
  }

  function humanEnterBattle() {
    var s = UI.state;
    if (!s || s.winner !== null || UI.busy || s.active !== 0 || s.phase !== 'prep') { return; }
    try {
      E.enterBattle(s);
    } catch (err) {
      toast(err.message, 'warn');
      return;
    }
    UI.selectedUid = null;
    UI.attackers = [];
    if (!E.readyUnits(s.players[0], s.turnNumber).length) {
      E.startBattle(s, []);
    }
    renderAll();
  }

  function toggleAllAttackers() {
    var s = UI.state;
    if (!s || s.phase !== 'battle' || s.battle) { return; }
    UI.attackers = [];
    E.readyUnits(s.players[0], s.turnNumber).forEach(function (x) {
      if (E.isTaunt(s, x.unit)) { return; }
      UI.attackers.push(x.unit.uid);
    });
    renderAll();
  }

  async function startHumanBattle() {
    var s = UI.state;
    if (!s || s.winner !== null || UI.busy || s.active !== 0 || s.phase !== 'battle' || s.battle) { return; }
    var uids = UI.attackers.slice();
    E.startBattle(s, uids);
    UI.busy = true;
    UI.attackers = [];
    renderAll();
    await sleep(220);
    if (!UI.state) { return; }
    await animateBattle(UI.epoch);
    UI.busy = false;
    renderAll();
    if (s.winner !== null) { showGameOver(); }
  }

  async function endHumanTurn() {
    var s = UI.state;
    if (!s || UI.busy || s.winner !== null || s.active !== 0 || s.phase !== 'cleanup') { return; }
    E.endTurn(s);
    renderAll();
    if (s.winner !== null) { showGameOver(); return; }
    if (s.active === 1) { runAITurn(); }
  }

  /* ---------------- 战斗动画 ---------------- */
  function cellEl(owner, row, col) {
    return document.querySelector('.cell[data-owner="' + owner + '"][data-row="' + row + '"][data-col="' + col + '"]');
  }
  function clearFx() { $('#fxLayer').innerHTML = ''; }

  function fxFloat(target, text, cls) {
    if (!target) { return; }
    var r = target.getBoundingClientRect();
    var d = document.createElement('div');
    d.className = 'float-text ' + (cls || '');
    d.textContent = text;
    d.style.left = (r.left + r.width / 2) + 'px';
    d.style.top = (r.top + r.height / 2) + 'px';
    $('#fxLayer').appendChild(d);
    setTimeout(function () { d.remove(); }, 1300);
  }

  function fxStrike(from, to) {
    if (!from || !to) { return; }
    var a = from.getBoundingClientRect();
    var b = to.getBoundingClientRect();
    var x1 = a.left + a.width / 2, y1 = a.top + a.height / 2;
    var x2 = b.left + b.width / 2, y2 = b.top + b.height / 2;
    var len = Math.max(20, Math.hypot(x2 - x1, y2 - y1));
    var ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    var line = document.createElement('div');
    line.className = 'strike-line';
    line.style.left = x1 + 'px';
    line.style.top = y1 + 'px';
    line.style.width = len + 'px';
    line.style.transform = 'rotate(' + ang + 'deg)';
    $('#fxLayer').appendChild(line);
    var imp = document.createElement('div');
    imp.className = 'impact';
    imp.style.left = x2 + 'px';
    imp.style.top = y2 + 'px';
    $('#fxLayer').appendChild(imp);
    setTimeout(function () { line.remove(); imp.remove(); }, 560);
  }

  function fxShake(el) {
    if (!el) { return; }
    el.classList.remove('city-hit');
    void el.offsetWidth;
    el.classList.add('city-hit');
    setTimeout(function () { el.classList.remove('city-hit'); }, 520);
  }

  async function animateBattle(myEpoch) {
    var s = UI.state;
    if (!s) { return; }
    while (s.phase === 'battle') {
      if (UI.epoch !== myEpoch || !UI.state) { return; }
      var peek = E.peekAttack(s);
      if (!peek) { break; }
      var atkOwner = s.active;
      var atkEl = cellEl(atkOwner, peek.attackerRow, peek.attackerCol);
      var defEl = peek.defender
        ? cellEl(1 - atkOwner, peek.defenderRow, peek.defenderCol)
        : document.getElementById('hero-' + (1 - atkOwner));
      var unitEl = atkEl ? atkEl.querySelector('.unit') : null;
      if (unitEl) { unitEl.classList.add('lunge'); }
      await sleep(150);
      fxStrike(atkEl, defEl);
      await sleep(260);
      if (UI.epoch !== myEpoch) { return; }
      var ev = E.nextAttack(s);
      if (!ev || !ev.attacker) { break; }
      renderAll();
      if (ev.defender) {
        var dCell = cellEl(1 - atkOwner, ev.defender.row, ev.defender.col);
        var aCell = cellEl(atkOwner, ev.attacker.row, ev.attacker.col);
        fxFloat(dCell, '-' + ev.dmgToDef, '');
        fxFloat(aCell, '-' + ev.dmgToAtk, 'small');
        ev.deaths.forEach(function (dd) {
          var deadCell = cellEl(dd.owner, dd.row, dd.col);
          fxFloat(deadCell, '阵亡', 'gold small');
        });
      } else if (ev.cityDamage) {
        var heroEl = document.getElementById('hero-' + (1 - atkOwner));
        fxShake(heroEl);
        fxFloat(heroEl, '-' + ev.cityDamage, 'gold');
      }
      await sleep(460);
      if (s.winner !== null) { break; }
    }
  }

  /* ---------------- AI 回合 ---------------- */
  function applyAIAction(act) {
    var s = UI.state;
    if (act.type === 'deploy') {
      E.deployDomestic(s, act.uid);
    } else if (act.type === 'play') {
      E.playCard(s, act.uid, act.row, act.col, act.targetUid);
      UI.animUid = act.uid;
      setTimeout(function () { UI.animUid = null; }, 400);
    } else if (act.type === 'deputy') {
      E.applyDeputyBonus(s, act.choice);
    }
  }

  async function aiActionLoop(myEpoch) {
    var s = UI.state;
    var guard = 0;
    while ((s.phase === 'prep' || s.phase === 'cleanup') && guard++ < 30) {
      if (UI.epoch !== myEpoch) { return false; }
      var act = AI.nextPrepAction(s);
      if (!act) { return true; }
      applyAIAction(act);
      renderAll();
      await sleep(620);
    }
    return true;
  }

  async function runAITurn() {
    var myEpoch = UI.epoch;
    var s = UI.state;
    if (!s || s.winner !== null || s.active !== 1) { return; }
    UI.busy = true;
    UI.selectedUid = null;
    renderAll();
    await sleep(650);
    if (UI.epoch !== myEpoch) { return; }

    await aiActionLoop(myEpoch);
    if (UI.epoch !== myEpoch || s.winner !== null) {
      UI.busy = false;
      if (s.winner !== null) { showGameOver(); }
      return;
    }

    if (s.phase === 'prep') {
      try { E.enterBattle(s); } catch (e) { /* ignore */ }
      renderAll();
      await sleep(420);
      var attackers = AI.planAttackers(s);
      E.startBattle(s, attackers);
      renderAll();
      await sleep(380);
      if (UI.epoch !== myEpoch || !UI.state) { return; }
      await animateBattle(myEpoch);
    }

    if (UI.epoch !== myEpoch) { return; }
    if (s.winner !== null) {
      UI.busy = false;
      showGameOver();
      return;
    }

    if (s.phase === 'cleanup') {
      await aiActionLoop(myEpoch);
    }
    if (UI.epoch !== myEpoch) { return; }
    if (s.winner !== null) {
      UI.busy = false;
      showGameOver();
      return;
    }
    await sleep(360);
    if (UI.epoch !== myEpoch) { return; }
    E.endTurn(s);
    UI.busy = false;
    renderAll();
    if (s.winner !== null) { showGameOver(); }
  }

  /* ---------------- 事件绑定 ---------------- */
  function handleCommand(cmd) {
    switch (cmd) {
      case 'battle': humanEnterBattle(); break;
      case 'all': toggleAllAttackers(); break;
      case 'clear': UI.attackers = []; renderAll(); break;
      case 'attack': startHumanBattle(); break;
      case 'endturn': endHumanTurn(); break;
    }
  }

  function onDocumentClick(e) {
    var t = e.target;
    var cmdEl = t.closest ? t.closest('[data-cmd]') : null;
    if (cmdEl) { handleCommand(cmdEl.getAttribute('data-cmd')); return; }
    var deckEl = t.closest ? t.closest('[data-deck]') : null;
    if (deckEl && UI.screen === 'menu') { selectDeck(deckEl.getAttribute('data-deck')); return; }
    var depEl = t.closest ? t.closest('[data-deputy]') : null;
    if (depEl && UI.screen === 'menu') { selectDeputy(depEl.getAttribute('data-deputy')); return; }
    if (UI.screen !== 'game' || !UI.state) { return; }
    var domEl = t.closest ? t.closest('.domestic-row') : null;
    if (domEl) { onDomesticClick(Number(domEl.getAttribute('data-owner'))); return; }
    var cell = t.closest ? t.closest('.cell') : null;
    if (cell) {
      onCellClick(Number(cell.getAttribute('data-owner')), Number(cell.getAttribute('data-row')), Number(cell.getAttribute('data-col')));
      return;
    }
    var handCard = t.closest ? t.closest('#handArea .card') : null;
    if (handCard) { onHandClick(handCard.getAttribute('data-uid')); return; }
  }

  /* ---------------- 提示气泡 ---------------- */
  function tipHtml(inst) {
    var d = D.cards[inst.defId];
    var s = UI.state;
    var extra = '';
    var onBoard = null;
    if (s) {
      for (var i = 0; i < 2; i++) {
        var f = E.findOnBoard(s.players[i], inst.uid);
        if (f) { onBoard = f; break; }
      }
    }
    var curHp = E.maxHp(inst) - inst.damage;
    if (onBoard) {
      if (inst.damage > 0) { extra += '已受伤 ' + inst.damage + ' 点（' + Math.max(0, curHp) + '/' + E.maxHp(inst) + '）<br>'; }
      if ((inst.bonusAtk || 0) || (inst.bonusHp || 0)) {
        extra += '副将加成：' + ((inst.bonusAtk || 0) ? '+1 攻击 ' : '') + ((inst.bonusHp || 0) ? '+1 生命' : '') + '<br>';
      }
      if (inst.effectAtk) { extra += '加成：+' + inst.effectAtk + ' 攻击<br>'; }
      if (inst.effectHp) { extra += '加成：+' + inst.effectHp + ' 生命<br>'; }
      var gv = E.guardValue(s, inst);
      if (gv) {
        var gRounds = (d.effect && d.effect.rounds) || 1;
        extra += '减伤 ' + gv + '（持续 ' + gRounds + ' 回合）<br>';
      }
      if (inst.summonTurn === s.turnNumber) { extra += '本回合登场，无法进攻<br>'; }
    } else if (s && s.players[0].domestic.indexOf(inst) >= 0) {
      extra += '内政区：横置产出 1 点「' + (d.attrs || [d.attr]).join('/') + '」中的一种兵权费用' + (inst.tapped ? '（已横置）' : '') + '<br>';
    }
    if (inst.isDeputy) { extra += '副将：登场时可选 +1 攻击或 +1 生命<br>'; }
    var atkVal = onBoard ? E.atkOf(inst) : (d.atk + (inst.bonusAtk || 0));
    var siegeVal = onBoard ? E.siegeOf(s, inst) : d.siege;
    return '<div class="tt-name">' + esc(d.name) + '<em>' + esc(d.subtitle) + '</em></div>' +
      '<div class="tt-type">' + d.type + ' · ' + esc(d.camp || '') + ' · ' + (d.legendary ? '传奇' : '普通') + ' · 兵权 ' + (d.attrs || [d.attr]).join('/') + '</div>' +
      '<div class="tt-cost">' + pipsHtml(d.cost) + '</div>' +
      '<div class="tt-stats">' +
        '<span>攻击<b>' + atkVal + '</b></span>' +
        '<span>攻城<b>' + siegeVal + '</b></span>' +
        '<span>生命<b>' + E.maxHp(inst) + '</b></span>' +
      '</div>' +
      (d.effect ? '<div class="tt-effect"><span class="kw">' + esc(d.effect.kw || '登场') + '</span> ' + esc(d.effect.text) + '</div>' : '') +
      (extra ? '<div class="tt-extra">' + extra + '</div>' : '') +
      '<div class="tt-flavor">' + esc(d.text) + '</div>';
  }

  function positionTip(e) {
    var tip = $('#tooltip');
    if (!tip.classList.contains('show')) { return; }
    var pad = 16;
    var w = tip.offsetWidth || 260;
    var h = tip.offsetHeight || 180;
    var x = e.clientX + pad;
    var y = e.clientY + pad;
    if (x + w > window.innerWidth - 10) { x = e.clientX - w - pad; }
    if (y + h > window.innerHeight - 10) { y = window.innerHeight - h - 10; }
    if (x < 10) { x = 10; }
    if (y < 10) { y = 10; }
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }

  function onMouseOver(e) {
    var el = e.target.closest ? e.target.closest('[data-uid]') : null;
    var tip = $('#tooltip');
    if (!el || !UI.state) { tip.classList.remove('show'); UI.tipUid = null; return; }
    var uid = el.getAttribute('data-uid');
    if (UI.tipUid !== uid) {
      var inst = instByUid(uid);
      if (!inst) { tip.classList.remove('show'); UI.tipUid = null; return; }
      UI.tipUid = uid;
      tip.innerHTML = tipHtml(inst);
    }
    tip.classList.add('show');
    positionTip(e);
  }

  function init() {
    renderMenu();

    $('#startBtn').addEventListener('click', function () {
      if (UI.starting) { return; }
      UI.starting = true;
      beginMatchSetup().finally(function () { UI.starting = false; });
    });
    $('#rulesBtn').addEventListener('click', showRules);
    $('#gameRulesBtn').addEventListener('click', showRules);
    $('#speedBtn').addEventListener('click', function () {
      UI.speedIdx = (UI.speedIdx + 1) % SPEEDS.length;
      UI.speed = SPEEDS[UI.speedIdx];
      $('#speedBtn').textContent = '动画 ' + UI.speed + 'x';
    });
    $('#quitBtn').addEventListener('click', async function () {
      var ok = await confirmModal('结束当前对局？', '当前进度不会保存，将返回套牌选择界面。');
      if (ok) { returnToMenu(); }
    });

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mousemove', function (e) {
      if ($('#tooltip').classList.contains('show')) { positionTip(e); }
    });

  }

  window.SanguoUI = { UI: UI, renderMenu: renderMenu, start: beginMatchSetup, renderAll: renderAll };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
