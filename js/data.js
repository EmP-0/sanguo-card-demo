/* =========================================================
 * 三国 · 战阵  ——  卡牌与套牌数据
 * 本文件由《卡牌数据.xlsx》自动生成；请改 Excel，不要手改本文件。
 * 数据格式：卡牌文本 [条件][触发器][效果ID, 参数...] + 效果表
 * 生成时间：2026-11-23 23:25:41
 * 生成命令：python tools/import_cards.py
 * ========================================================= */
var SanguoData = (function () {
  'use strict';

  var ATTRS = ['步', '弓', '骑', '谋'];
  var cards = {
  "zhangjiao": {
    "id": "zhangjiao",
    "name": "张角",
    "subtitle": "起义军&首领",
    "type": "将领",
    "category": "将领",
    "camp": "黄巾",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 2,
      "步": 2,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 4,
    "hp": 3,
    "siege": 1,
    "text": "苍天已死，黄天当立。",
    "ruleText": "[条件:1黄巾][登场][strategist_draw, 1][进攻时][buff_all, 黄巾, 0, 1]",
    "legendary": true,
    "faction": "huangjin",
    "effect": {
      "short": "[1黄巾]抓 1 张 / 进攻·+0/+1",
      "text": "[1黄巾]抓 1 张牌；进攻：所有黄巾军获得+0攻/+1生命。",
      "kw": "登场"
    },
    "abilities": [
      {
        "trigger": "onPlay",
        "effect": {
          "type": "draw",
          "value": 1
        },
        "effect_id": "strategist_draw",
        "params": [
          "1"
        ],
        "short": "抓 1 张",
        "text": "抓 1 张牌。",
        "condition": {
          "camp": "黄巾",
          "count": 1,
          "other": true
        }
      },
      {
        "trigger": "onAttack",
        "effect": {
          "type": "buffAll",
          "camp": "黄巾",
          "atk": 0,
          "hp": 1
        },
        "effect_id": "buff_all",
        "params": [
          "黄巾",
          "0",
          "1"
        ],
        "short": "+0/+1",
        "text": "所有黄巾军获得+0攻/+1生命。",
        "condition": {
          "camp": "黄巾",
          "count": 1,
          "other": true
        }
      }
    ]
  },
  "zhangliang": {
    "id": "zhangliang",
    "name": "张梁",
    "subtitle": "起义军&首领",
    "type": "将领",
    "category": "将领",
    "camp": "黄巾",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 2,
      "步": 2,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 3,
    "hp": 4,
    "siege": 1,
    "text": "人公将军，勇冠黄巾。",
    "ruleText": "[条件:1黄巾][登场][strategist_draw, 1][进攻时][buff_all, 黄巾, 1, 0]",
    "legendary": true,
    "faction": "huangjin",
    "effect": {
      "short": "[1黄巾]抓 1 张 / 进攻·+1/+0",
      "text": "[1黄巾]抓 1 张牌；进攻：所有黄巾军获得+1攻/+0生命。",
      "kw": "登场"
    },
    "abilities": [
      {
        "trigger": "onPlay",
        "effect": {
          "type": "draw",
          "value": 1
        },
        "effect_id": "strategist_draw",
        "params": [
          "1"
        ],
        "short": "抓 1 张",
        "text": "抓 1 张牌。",
        "condition": {
          "camp": "黄巾",
          "count": 1,
          "other": true
        }
      },
      {
        "trigger": "onAttack",
        "effect": {
          "type": "buffAll",
          "camp": "黄巾",
          "atk": 1,
          "hp": 0
        },
        "effect_id": "buff_all",
        "params": [
          "黄巾",
          "1",
          "0"
        ],
        "short": "+1/+0",
        "text": "所有黄巾军获得+1攻/+0生命。",
        "condition": {
          "camp": "黄巾",
          "count": 1,
          "other": true
        }
      }
    ]
  },
  "zhangbao": {
    "id": "zhangbao",
    "name": "张宝",
    "subtitle": "起义军&首领",
    "type": "将领",
    "category": "将领",
    "camp": "黄巾",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 1,
      "步": 2,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 3,
    "hp": 3,
    "siege": 2,
    "text": "地公将军，善役鬼神。",
    "ruleText": "[条件:1黄巾][登场][strategist_draw, 1]",
    "legendary": true,
    "faction": "huangjin",
    "effect": {
      "short": "[1黄巾]抓 1 张",
      "text": "[1黄巾]抓 1 张牌。",
      "kw": "登场"
    },
    "abilities": [
      {
        "trigger": "onPlay",
        "effect": {
          "type": "draw",
          "value": 1
        },
        "effect_id": "strategist_draw",
        "params": [
          "1"
        ],
        "short": "抓 1 张",
        "text": "抓 1 张牌。",
        "condition": {
          "camp": "黄巾",
          "count": 1,
          "other": true
        }
      }
    ]
  },
  "zhoucang": {
    "id": "zhoucang",
    "name": "周仓",
    "subtitle": "起义军",
    "type": "将领",
    "category": "将领",
    "camp": "黄巾",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 2,
      "步": 1,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 2,
    "hp": 3,
    "siege": 1,
    "text": "青龙偃月，扛刀紧随。",
    "ruleText": "[先锋][buff_self, 攻, 1]",
    "legendary": true,
    "faction": "huangjin",
    "effect": {
      "short": "攻+1",
      "text": "攻+1。",
      "kw": "先锋"
    },
    "abilities": [
      {
        "trigger": "static",
        "effect": {
          "type": "buffSelf",
          "stat": "atk",
          "value": 1
        },
        "effect_id": "buff_self",
        "params": [
          "攻",
          "1"
        ],
        "short": "攻+1",
        "text": "攻+1。",
        "row": 0
      }
    ]
  },
  "dengmao": {
    "id": "dengmao",
    "name": "邓茂",
    "subtitle": "起义军",
    "type": "将领",
    "category": "将领",
    "camp": "黄巾",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 1,
      "步": 1,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 2,
    "hp": 2,
    "siege": 1,
    "text": "黄巾先锋，斩将夺旗。",
    "ruleText": "[中军][buff_self, 命, 1]",
    "legendary": true,
    "faction": "huangjin",
    "effect": {
      "short": "命+1",
      "text": "命+1。",
      "kw": "中军"
    },
    "abilities": [
      {
        "trigger": "static",
        "effect": {
          "type": "buffSelf",
          "stat": "hp",
          "value": 1
        },
        "effect_id": "buff_self",
        "params": [
          "命",
          "1"
        ],
        "short": "命+1",
        "text": "命+1。",
        "row": 1
      }
    ]
  },
  "zhangmancheng": {
    "id": "zhangmancheng",
    "name": "张曼成",
    "subtitle": "起义军&首领",
    "type": "将领",
    "category": "将领",
    "camp": "黄巾",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 2,
      "步": 2,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 4,
    "hp": 4,
    "siege": 1,
    "text": "南阳渠帅，贯穿敌阵。",
    "ruleText": "[静态][trample]",
    "legendary": true,
    "faction": "huangjin",
    "effect": {
      "short": "",
      "text": "击杀后溢出伤害打同列后续单位，不攻城。",
      "kw": "贯穿"
    },
    "abilities": [
      {
        "trigger": "static",
        "effect": {
          "type": "trample"
        },
        "effect_id": "trample",
        "params": [],
        "short": "贯穿",
        "text": "击杀后溢出伤害打同列后续单位，不攻城。"
      }
    ]
  },
  "mayuanyi": {
    "id": "mayuanyi",
    "name": "马元义",
    "subtitle": "起义军",
    "type": "将领",
    "category": "将领",
    "camp": "黄巾",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 2,
      "步": 1,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 0,
    "hp": 1,
    "siege": 0,
    "text": "洛阳内应，事败身死。",
    "ruleText": "[条件:3黄巾][亡语][strategist_draw, 2]",
    "legendary": true,
    "faction": "huangjin",
    "effect": {
      "short": "[3黄巾]抓 2 张",
      "text": "[3黄巾]抓 2 张牌。",
      "kw": "亡语"
    },
    "abilities": [
      {
        "trigger": "onDeath",
        "effect": {
          "type": "draw",
          "value": 2
        },
        "effect_id": "strategist_draw",
        "params": [
          "2"
        ],
        "short": "抓 2 张",
        "text": "抓 2 张牌。",
        "condition": {
          "camp": "黄巾",
          "count": 3,
          "other": true
        }
      }
    ]
  },
  "bianxi": {
    "id": "bianxi",
    "name": "卞喜",
    "subtitle": "起义军",
    "type": "将领",
    "category": "将领",
    "camp": "黄巾",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 0,
      "步": 1,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 2,
    "hp": 1,
    "siege": 1,
    "text": "汜水关将，镇守后方。",
    "ruleText": "[后卫][buff_self, 攻, 1]",
    "legendary": true,
    "faction": "huangjin",
    "effect": {
      "short": "攻+1",
      "text": "攻+1。",
      "kw": "后卫"
    },
    "abilities": [
      {
        "trigger": "static",
        "effect": {
          "type": "buffSelf",
          "stat": "atk",
          "value": 1
        },
        "effect_id": "buff_self",
        "params": [
          "攻",
          "1"
        ],
        "short": "攻+1",
        "text": "攻+1。",
        "row": 2
      }
    ]
  },
  "huangjinbubing": {
    "id": "huangjinbubing",
    "name": "黄巾步兵",
    "subtitle": "起义军",
    "type": "部队",
    "category": "部队",
    "camp": "黄巾",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 0,
      "步": 1,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 1,
    "hp": 3,
    "siege": 1,
    "text": "裹黄巾，持竹枪。",
    "ruleText": "",
    "legendary": false,
    "faction": "huangjin"
  },
  "huangjinqiangbing": {
    "id": "huangjinqiangbing",
    "name": "黄巾枪兵",
    "subtitle": "起义军",
    "type": "部队",
    "category": "部队",
    "camp": "黄巾",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 0,
      "步": 1,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 2,
    "hp": 3,
    "siege": 1,
    "text": "长枪如林，蚁附而上。",
    "ruleText": "",
    "legendary": false,
    "faction": "huangjin"
  },
  "wuhezhizhong": {
    "id": "wuhezhizhong",
    "name": "乌合之众",
    "subtitle": "起义军",
    "type": "部队",
    "category": "部队",
    "camp": "黄巾",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 1,
      "步": 0,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 1,
    "hp": 2,
    "siege": 1,
    "text": "揭竿而起，聚散如风。",
    "ruleText": "[条件:2黄巾][静态][attack_immune, 黄巾, 2]",
    "legendary": false,
    "faction": "huangjin",
    "effect": {
      "short": "[2黄巾]进攻免伤",
      "text": "[2黄巾]若场上有2个其他黄巾单位，进攻时不受伤害。",
      "kw": "免伤"
    },
    "abilities": [
      {
        "trigger": "static",
        "effect": {
          "type": "attackImmune"
        },
        "effect_id": "attack_immune",
        "params": [
          "黄巾",
          "2"
        ],
        "short": "进攻免伤",
        "text": "若场上有2个其他黄巾单位，进攻时不受伤害。",
        "condition": {
          "camp": "黄巾",
          "count": 2,
          "other": true
        }
      }
    ]
  },
  "huangjinjingbing": {
    "id": "huangjinjingbing",
    "name": "黄巾精兵",
    "subtitle": "起义军",
    "type": "部队",
    "category": "部队",
    "camp": "黄巾",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 0,
      "步": 1,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 2,
    "hp": 1,
    "siege": 1,
    "text": "黄巾精锐，攻城先登。",
    "ruleText": "[条件:2黄巾][静态][siege_bonus, 黄巾, 2, 1]",
    "legendary": false,
    "faction": "huangjin",
    "effect": {
      "short": "[2黄巾]攻城+1",
      "text": "[2黄巾]若场上有2个其他黄巾单位，攻城+1。",
      "kw": "攻城"
    },
    "abilities": [
      {
        "trigger": "static",
        "effect": {
          "type": "siege",
          "value": 1
        },
        "effect_id": "siege_bonus",
        "params": [
          "黄巾",
          "2",
          "1"
        ],
        "short": "攻城+1",
        "text": "若场上有2个其他黄巾单位，攻城+1。",
        "condition": {
          "camp": "黄巾",
          "count": 2,
          "other": true
        }
      }
    ]
  },
  "huangjinzhanqi": {
    "id": "huangjinzhanqi",
    "name": "黄巾战棋",
    "subtitle": "起义军",
    "type": "部队",
    "category": "部队",
    "camp": "黄巾",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 1,
      "步": 2,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 0,
    "hp": 5,
    "siege": 1,
    "text": "四格之内，黄巾同袍。",
    "ruleText": "[静态][aura_adjacent, 前后左右, 黄巾, +1/+1]",
    "legendary": false,
    "faction": "huangjin",
    "effect": {
      "short": "四格光环",
      "text": "相邻前后左右格黄巾获得+1/+1。",
      "kw": "光环"
    },
    "abilities": [
      {
        "trigger": "static",
        "effect": {
          "type": "aura",
          "directions": "all",
          "camp": "黄巾",
          "atk": 1,
          "hp": 1
        },
        "effect_id": "aura_adjacent",
        "params": [
          "前后左右",
          "黄巾",
          "+1/+1"
        ],
        "short": "四格光环",
        "text": "相邻前后左右格黄巾获得+1/+1。"
      }
    ]
  },
  "jieganerqi": {
    "id": "jieganerqi",
    "name": "揭竿而起",
    "subtitle": "谋略",
    "type": "谋略",
    "category": "谋略",
    "camp": "黄巾",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 1,
      "步": 1,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 0,
    "hp": 0,
    "siege": 0,
    "text": "王侯将相，宁有种乎。",
    "ruleText": "[谋略][buff_all, 黄巾, 1, 1]",
    "legendary": false,
    "faction": "huangjin",
    "effect": {
      "short": "+1/+1",
      "text": "所有黄巾军获得+1攻/+1生命。",
      "kw": "谋略"
    },
    "abilities": [
      {
        "trigger": "strategy",
        "effect": {
          "type": "buffAll",
          "camp": "黄巾",
          "atk": 1,
          "hp": 1
        },
        "effect_id": "buff_all",
        "params": [
          "黄巾",
          "1",
          "1"
        ],
        "short": "+1/+1",
        "text": "所有黄巾军获得+1攻/+1生命。"
      }
    ]
  },
  "liubei": {
    "id": "liubei",
    "name": "刘备",
    "subtitle": "汉室宗亲",
    "type": "将领",
    "category": "将领",
    "camp": "汉",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 1,
      "步": 1,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 1,
    "hp": 1,
    "siege": 1,
    "text": "织席贩履，志在天下。",
    "ruleText": "[进场][rally_adjacent, 左右, 1, 1]",
    "legendary": true,
    "faction": "han",
    "effect": {
      "short": "相邻+1/+1",
      "text": "进场时，左右相邻的我方单位获得 +1 攻 / +1 生命。",
      "kw": "登场"
    },
    "abilities": [
      {
        "trigger": "onPlay",
        "effect": {
          "type": "buffAdjacent",
          "directions": "lr",
          "atk": 1,
          "hp": 1
        },
        "effect_id": "rally_adjacent",
        "params": [
          "左右",
          "1",
          "1"
        ],
        "short": "相邻+1/+1",
        "text": "进场时，左右相邻的我方单位获得 +1 攻 / +1 生命。"
      }
    ]
  },
  "guanyu": {
    "id": "guanyu",
    "name": "关羽",
    "subtitle": "汉寿亭侯",
    "type": "将领",
    "category": "将领",
    "camp": "汉",
    "attr": "骑",
    "attrs": [
      "骑"
    ],
    "cost": {
      "generic": 1,
      "步": 0,
      "弓": 0,
      "骑": 1,
      "谋": 0
    },
    "atk": 2,
    "hp": 2,
    "siege": 1,
    "text": "义薄云天，青龙偃月。",
    "ruleText": "[静态][first_strike_if_buffed]",
    "legendary": true,
    "faction": "han",
    "effect": {
      "short": "",
      "text": "攻击力高于初始值时获得敏捷。",
      "kw": "敏捷"
    },
    "abilities": [
      {
        "trigger": "static",
        "effect": {
          "type": "firstStrikeCond"
        },
        "effect_id": "first_strike_if_buffed",
        "params": [],
        "short": "敏捷",
        "text": "攻击力高于初始值时获得敏捷。"
      }
    ]
  },
  "zhangfei": {
    "id": "zhangfei",
    "name": "张飞",
    "subtitle": "燕人",
    "type": "将领",
    "category": "将领",
    "camp": "汉",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 1,
      "步": 1,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 2,
    "hp": 2,
    "siege": 1,
    "text": "燕人张翼德，声若巨雷。",
    "ruleText": "[静态][trample_if_buffed]",
    "legendary": true,
    "faction": "han",
    "effect": {
      "short": "",
      "text": "攻击力高于初始值时获得贯穿。",
      "kw": "贯穿"
    },
    "abilities": [
      {
        "trigger": "static",
        "effect": {
          "type": "trampleCond"
        },
        "effect_id": "trample_if_buffed",
        "params": [],
        "short": "贯穿",
        "text": "攻击力高于初始值时获得贯穿。"
      }
    ]
  },
  "zhujun": {
    "id": "zhujun",
    "name": "朱儁",
    "subtitle": "汉室名将",
    "type": "将领",
    "category": "将领",
    "camp": "汉",
    "attr": "步",
    "attrs": [
      "步",
      "骑"
    ],
    "cost": {
      "generic": 0,
      "步": 2,
      "弓": 0,
      "骑": 1,
      "谋": 0
    },
    "atk": 3,
    "hp": 4,
    "siege": 1,
    "text": "汉室名将，讨平黄巾。",
    "ruleText": "",
    "legendary": true,
    "faction": "han"
  },
  "huangfusong": {
    "id": "huangfusong",
    "name": "皇甫嵩",
    "subtitle": "槐里侯",
    "type": "将领",
    "category": "将领",
    "camp": "汉",
    "attr": "步",
    "attrs": [
      "步",
      "骑"
    ],
    "cost": {
      "generic": 1,
      "步": 1,
      "弓": 0,
      "骑": 2,
      "谋": 0
    },
    "atk": 5,
    "hp": 4,
    "siege": 2,
    "text": "威震天下，功盖当时。",
    "ruleText": "",
    "legendary": true,
    "faction": "han"
  },
  "luzhi": {
    "id": "luzhi",
    "name": "卢植",
    "subtitle": "海内大儒",
    "type": "将领",
    "category": "将领",
    "camp": "汉",
    "attr": "骑",
    "attrs": [
      "骑"
    ],
    "cost": {
      "generic": 3,
      "步": 1,
      "弓": 0,
      "骑": 1,
      "谋": 0
    },
    "atk": 4,
    "hp": 4,
    "siege": 1,
    "text": "海内大儒，文武兼资。",
    "ruleText": "[后卫][进场][rally_row, 先锋, 1, 1]",
    "legendary": true,
    "faction": "han",
    "effect": {
      "short": "先锋排+1/+1",
      "text": "进场时，先锋排的我方单位获得 +1 攻 / +1 生命。",
      "kw": "后卫·登场"
    },
    "abilities": [
      {
        "trigger": "onPlay",
        "effect": {
          "type": "buffRow",
          "row": 0,
          "atk": 1,
          "hp": 1
        },
        "effect_id": "rally_row",
        "params": [
          "先锋",
          "1",
          "1"
        ],
        "short": "先锋排+1/+1",
        "text": "进场时，先锋排的我方单位获得 +1 攻 / +1 生命。",
        "row": 2
      }
    ]
  },
  "sunjian": {
    "id": "sunjian",
    "name": "孙坚",
    "subtitle": "江东猛虎",
    "type": "将领",
    "category": "将领",
    "camp": "汉",
    "attr": "骑",
    "attrs": [
      "骑"
    ],
    "cost": {
      "generic": 1,
      "步": 0,
      "弓": 0,
      "骑": 2,
      "谋": 0
    },
    "atk": 4,
    "hp": 3,
    "siege": 1,
    "text": "江东猛虎，讨逆先锋。",
    "ruleText": "[进攻时][next_attacker_atk, 1]",
    "legendary": true,
    "faction": "han",
    "effect": {
      "short": "后续+1攻",
      "text": "进攻时，下一个进攻的将领 +1 攻击。",
      "kw": "进攻"
    },
    "abilities": [
      {
        "trigger": "onAttack",
        "effect": {
          "type": "nextAttacker",
          "value": 1
        },
        "effect_id": "next_attacker_atk",
        "params": [
          "1"
        ],
        "short": "后续+1攻",
        "text": "进攻时，下一个进攻的将领 +1 攻击。"
      }
    ]
  },
  "caocao": {
    "id": "caocao",
    "name": "曹操",
    "subtitle": "汉相",
    "type": "将领",
    "category": "将领",
    "camp": "汉",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 1,
      "步": 2,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 3,
    "hp": 4,
    "siege": 1,
    "text": "治世能臣，乱世奸雄。",
    "ruleText": "[进攻时][next_attacker_atk, 1]",
    "legendary": true,
    "faction": "han",
    "effect": {
      "short": "后续+1攻",
      "text": "进攻时，下一个进攻的将领 +1 攻击。",
      "kw": "进攻"
    },
    "abilities": [
      {
        "trigger": "onAttack",
        "effect": {
          "type": "nextAttacker",
          "value": 1
        },
        "effect_id": "next_attacker_atk",
        "params": [
          "1"
        ],
        "short": "后续+1攻",
        "text": "进攻时，下一个进攻的将领 +1 攻击。"
      }
    ]
  },
  "qibing": {
    "id": "qibing",
    "name": "骑兵",
    "subtitle": "轻骑",
    "type": "部队",
    "category": "部队",
    "camp": "汉",
    "attr": "骑",
    "attrs": [
      "骑"
    ],
    "cost": {
      "generic": 1,
      "步": 0,
      "弓": 0,
      "骑": 1,
      "谋": 0
    },
    "atk": 2,
    "hp": 2,
    "siege": 1,
    "text": "轻骑突击，来去如风。",
    "ruleText": "[先锋][静态][first_strike]",
    "legendary": false,
    "faction": "han",
    "effect": {
      "short": "敏捷",
      "text": "进攻时先结算伤害；若击杀目标则不受反击。",
      "kw": "先锋"
    },
    "abilities": [
      {
        "trigger": "static",
        "effect": {
          "type": "firstStrike"
        },
        "effect_id": "first_strike",
        "params": [],
        "short": "敏捷",
        "text": "进攻时先结算伤害；若击杀目标则不受反击。",
        "row": 0
      }
    ]
  },
  "zhongzhuangqibing": {
    "id": "zhongzhuangqibing",
    "name": "重装骑兵",
    "subtitle": "重骑",
    "type": "部队",
    "category": "部队",
    "camp": "汉",
    "attr": "步",
    "attrs": [
      "步",
      "骑"
    ],
    "cost": {
      "generic": 1,
      "步": 1,
      "弓": 0,
      "骑": 1,
      "谋": 0
    },
    "atk": 3,
    "hp": 3,
    "siege": 1,
    "text": "人马俱甲，冲阵破敌。",
    "ruleText": "",
    "legendary": false,
    "faction": "han"
  },
  "toushiche": {
    "id": "toushiche",
    "name": "投石车",
    "subtitle": "器械",
    "type": "部队",
    "category": "部队",
    "camp": "汉",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 2,
      "步": 2,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 0,
    "hp": 6,
    "siege": 2,
    "text": "飞石破城，攻坚利器。",
    "ruleText": "[后卫][静态][siege_row, 1]",
    "legendary": false,
    "faction": "han",
    "effect": {
      "short": "攻城+1",
      "text": "在触发排时攻城 +1。",
      "kw": "后卫"
    },
    "abilities": [
      {
        "trigger": "static",
        "effect": {
          "type": "siegeRow",
          "value": 1
        },
        "effect_id": "siege_row",
        "params": [
          "1"
        ],
        "short": "攻城+1",
        "text": "在触发排时攻城 +1。",
        "row": 2
      }
    ]
  },
  "dunbing": {
    "id": "dunbing",
    "name": "盾兵",
    "subtitle": "守军",
    "type": "部队",
    "category": "部队",
    "camp": "汉",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 1,
      "步": 2,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 0,
    "hp": 5,
    "siege": 1,
    "text": "持盾列阵，守土不退。",
    "ruleText": "[静态][taunt, 1]",
    "legendary": false,
    "faction": "han",
    "effect": {
      "short": "守军1",
      "text": "守军：不能主动进攻。",
      "kw": "守军"
    },
    "abilities": [
      {
        "trigger": "static",
        "effect": {
          "type": "taunt",
          "value": 1
        },
        "effect_id": "taunt",
        "params": [
          "1"
        ],
        "short": "守军1",
        "text": "守军：不能主动进攻。"
      }
    ]
  },
  "tuntianjun": {
    "id": "tuntianjun",
    "name": "屯田军",
    "subtitle": "屯田",
    "type": "部队",
    "category": "部队",
    "camp": "汉",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 1,
      "步": 2,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 2,
    "hp": 3,
    "siege": 1,
    "text": "且耕且战，粮草自足。",
    "ruleText": "[中军][进场][strategist_draw, 1]",
    "legendary": false,
    "faction": "han",
    "effect": {
      "short": "抓 1 张",
      "text": "抓 1 张牌。",
      "kw": "中军·登场"
    },
    "abilities": [
      {
        "trigger": "onPlay",
        "effect": {
          "type": "draw",
          "value": 1
        },
        "effect_id": "strategist_draw",
        "params": [
          "1"
        ],
        "short": "抓 1 张",
        "text": "抓 1 张牌。",
        "row": 1
      }
    ]
  },
  "judun": {
    "id": "judun",
    "name": "举盾",
    "subtitle": "谋略",
    "type": "谋略",
    "category": "谋略",
    "camp": "汉",
    "attr": "步",
    "attrs": [
      "步"
    ],
    "cost": {
      "generic": 0,
      "步": 2,
      "弓": 0,
      "骑": 0,
      "谋": 0
    },
    "atk": 0,
    "hp": 0,
    "siege": 0,
    "text": "举盾相护，矢石难伤。",
    "ruleText": "[谋略][resist, 1]",
    "legendary": false,
    "faction": "han",
    "effect": {
      "short": "抵抗1",
      "text": "目标单位本回合获得 1 点减伤。",
      "kw": "谋略"
    },
    "abilities": [
      {
        "trigger": "strategy",
        "effect": {
          "type": "resist",
          "value": 1
        },
        "effect_id": "resist",
        "params": [
          "1"
        ],
        "short": "抵抗1",
        "text": "目标单位本回合获得 1 点减伤。"
      }
    ],
    "targeted": true
  }
};
  var decks = [
  {
    "id": "huangjin",
    "name": "黄巾 · 苍天已死",
    "faction": "huangjin",
    "status": "草稿",
    "style": "铺场 · 黄巾",
    "tagline": "苍天已死，黄天当立；靠黄巾人数滚雪球。",
    "desc": "以张角三兄弟和起义军铺场，靠 [N黄巾] 条件、进场抓牌、进攻群体 buff、亡语和四格光环滚雪球。",
    "hero": {
      "name": "张角",
      "title": "天公将军",
      "hp": 12,
      "quote": "苍天已死，黄天当立。"
    },
    "recommendedDeputy": "zhangjiao",
    "cards": [
      {
        "id": "zhangjiao",
        "count": 1
      },
      {
        "id": "zhangliang",
        "count": 1
      },
      {
        "id": "zhangbao",
        "count": 1
      },
      {
        "id": "zhoucang",
        "count": 1
      },
      {
        "id": "dengmao",
        "count": 1
      },
      {
        "id": "zhangmancheng",
        "count": 1
      },
      {
        "id": "mayuanyi",
        "count": 1
      },
      {
        "id": "bianxi",
        "count": 1
      },
      {
        "id": "huangjinbubing",
        "count": 2
      },
      {
        "id": "huangjinqiangbing",
        "count": 2
      },
      {
        "id": "wuhezhizhong",
        "count": 2
      },
      {
        "id": "huangjinjingbing",
        "count": 2
      },
      {
        "id": "huangjinzhanqi",
        "count": 2
      },
      {
        "id": "jieganerqi",
        "count": 2
      }
    ]
  },
  {
    "id": "han",
    "name": "汉军 · 匡扶汉室",
    "faction": "han",
    "status": "草稿",
    "style": "增益 · 步骑",
    "tagline": "汉室倾颓，赖诸君戮力；靠相邻/整排增益滚起数值。",
    "desc": "以刘邦为旗，刘备、关羽、张飞与汉末名将组成的中速步骑：刘备相邻增益、卢植后排支援、孙坚/曹操鼓舞后续，关羽敏捷、张飞贯穿，靠增益把中坚单位推过击杀线。",
    "hero": {
      "name": "刘邦",
      "title": "汉高祖",
      "hp": 12,
      "quote": "大风起兮云飞扬，威加海内兮归故乡。"
    },
    "recommendedDeputy": "liubei",
    "cards": [
      {
        "id": "liubei",
        "count": 1
      },
      {
        "id": "guanyu",
        "count": 1
      },
      {
        "id": "zhangfei",
        "count": 1
      },
      {
        "id": "zhujun",
        "count": 1
      },
      {
        "id": "huangfusong",
        "count": 1
      },
      {
        "id": "luzhi",
        "count": 1
      },
      {
        "id": "sunjian",
        "count": 1
      },
      {
        "id": "caocao",
        "count": 1
      },
      {
        "id": "qibing",
        "count": 2
      },
      {
        "id": "zhongzhuangqibing",
        "count": 2
      },
      {
        "id": "toushiche",
        "count": 2
      },
      {
        "id": "dunbing",
        "count": 2
      },
      {
        "id": "tuntianjun",
        "count": 2
      },
      {
        "id": "judun",
        "count": 2
      }
    ]
  }
];

  function getDeck(id) {
    for (var i = 0; i < decks.length; i++) { if (decks[i].id === id) return decks[i]; }
    return null;
  }

  function deckCardCount(deck) {
    return deck.cards.reduce(function (s, e) { return s + e.count; }, 0);
  }

  function legendariesOf(deck) {
    return deck.cards
      .filter(function (e) { return cards[e.id] && cards[e.id].legendary; })
      .map(function (e) { return cards[e.id]; });
  }

  function deckStats(deck) {
    var attr = { '步': 0, '弓': 0, '骑': 0, '谋': 0 };
    var legendary = 0, normal = 0, totalCost = 0, n = 0;
    var atk = 0, hp = 0, siege = 0;
    deck.cards.forEach(function (e) {
      var c = cards[e.id];
      (c.attrs || [c.attr]).forEach(function (a) { attr[a] = (attr[a] || 0) + e.count; });
      if (c.legendary) legendary += e.count; else normal += e.count;
      totalCost += (c.cost.generic + c.cost['步'] + c.cost['弓'] + c.cost['骑'] + c.cost['谋']) * e.count;
      atk += c.atk * e.count;
      hp += c.hp * e.count;
      siege += c.siege * e.count;
      n += e.count;
    });
    return {
      attr: attr, legendary: legendary, normal: normal, total: n,
      avgCost: n ? totalCost / n : 0,
      avgAtk: n ? atk / n : 0,
      avgHp: n ? hp / n : 0,
      avgSiege: n ? siege / n : 0
    };
  }

  function costTotal(cost) {
    return (cost.generic || 0) + (cost['步'] || 0) + (cost['弓'] || 0) + (cost['骑'] || 0) + (cost['谋'] || 0);
  }

  return {
    ATTRS: ATTRS,
    cards: cards,
    decks: decks,
    getDeck: getDeck,
    deckCardCount: deckCardCount,
    legendariesOf: legendariesOf,
    deckStats: deckStats,
    costTotal: costTotal
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = SanguoData; }
