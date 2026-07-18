import type { Spread } from "@/types/tarot";

export const spreads: Spread[] = [
  {
    id: "free3",
    name: "三张自由牌",
    eyebrow: "自由观察",
    description: "不预设固定时间或因果，让三张牌共同照见问题的不同侧面。",
    positions: ["第一张", "第二张", "第三张"],
    category: "通用",
  },
  {
    id: "monthly",
    name: "月运势",
    eyebrow: "一月流转",
    description: "观察月初、月中、月末的节奏，以及贯穿整月的行动提醒。",
    positions: ["月初状态", "月中发展", "月末趋势", "整月建议"],
    category: "通用",
  },
  {
    id: "careerPyramid",
    name: "事业金字塔",
    eyebrow: "工作与成长",
    description: "从现状、可用方法、主要阻碍与未来趋势梳理职业问题。",
    positions: ["现状", "建议与解决方法", "主要阻碍", "未来发展"],
    category: "事业",
  },
  {
    id: "lovePyramid",
    name: "关系金字塔",
    eyebrow: "亲密关系",
    description: "观察你的感受、互动中呈现的对方立场、关系现状与可能走向。",
    positions: ["我的感受与立场", "互动中呈现的对方立场", "关系现状", "未来发展"],
    category: "感情",
  },
  {
    id: "choice",
    name: "二选一",
    eyebrow: "两条道路",
    description: "比较 A、B 两种选择各自的发展过程与可能结果，不替你作决定。",
    positions: ["当前核心", "A 的发展", "A 的可能结果", "B 的发展", "B 的可能结果"],
    needsOptions: true,
    category: "抉择",
  },
  {
    id: "loverCross",
    name: "恋人十字",
    eyebrow: "关系脉络",
    description: "从双方的互动立场、过去模式、当下状态与未来趋势理解关系。",
    positions: ["你的感受与立场", "互动中呈现的对方立场", "过去模式", "关系现状", "未来趋势"],
    category: "感情",
  },
  {
    id: "career6",
    name: "事业六芒星",
    eyebrow: "职场全景",
    description: "系统观察匹配度、成长空间、人际、管理关系、风险与外部机会。",
    positions: ["工作匹配度", "发展空间", "人际关系", "与管理者的互动", "注意事项", "其他机会"],
    category: "事业",
  },
  {
    id: "venus",
    name: "维纳斯之镜",
    eyebrow: "深层关系",
    description: "多角度观察双方感受、关系影响、核心阻碍与后续心态。",
    positions: ["你的真实感受", "对方呈现的互动立场", "关系对你的影响", "关系对对方的可能影响", "核心阻碍", "关系趋势", "你之后的心态", "对方可能呈现的心态"],
    category: "感情",
  },
  {
    id: "inspiration",
    name: "心灵对应",
    eyebrow: "镜像对话",
    description: "用三组镜像位置观察双方的认知、感受与行动，再看未来与建议。",
    positions: ["你的认知", "对方呈现的认知", "你的感受", "对方呈现的感受", "你的行动倾向", "对方呈现的行动倾向", "未来趋势", "给你的建议"],
    category: "感情",
  },
];

export const getSpread = (id: string) => spreads.find((spread) => spread.id === id);
