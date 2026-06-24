import type { CatalogProduct, CategoryDef, CategoryKey } from "./aislely-types";

// 品类定义 —— 货架标注时零打字点选;keywords 同时用于查询的品类兜底
export const CATEGORIES: CategoryDef[] = [
  { key: "noodle", zh: "方便面/速食", en: "Instant Noodles", emoji: "🍜", keywords: ["方便面", "泡面", "拉面", "杯面", "速食", "ramen", "noodle", "instant"] },
  { key: "sauce", zh: "调味酱料", en: "Sauces & Seasoning", emoji: "🥫", keywords: ["酱", "酱油", "调味", "醋", "油", "sauce", "soy", "seasoning", "vinegar"] },
  { key: "snack", zh: "零食饼干", en: "Snacks", emoji: "🍪", keywords: ["零食", "饼干", "薯片", "糖", "snack", "chips", "cookie", "candy"] },
  { key: "drink", zh: "饮料冲调", en: "Drinks", emoji: "🥤", keywords: ["饮料", "汽水", "茶", "咖啡", "水", "drink", "soda", "tea", "juice", "water"] },
  { key: "frozen", zh: "冷冻食品", en: "Frozen Food", emoji: "🧊", keywords: ["冷冻", "速冻", "水饺", "冰", "frozen", "dumpling", "ice cream"] },
  { key: "grain", zh: "米面粮油", en: "Rice, Grains & Oil", emoji: "🍚", keywords: ["米", "面粉", "粮油", "豆", "rice", "flour", "grain", "oil", "bean"] },
  { key: "dairy", zh: "乳品烘焙", en: "Dairy & Bakery", emoji: "🥛", keywords: ["牛奶", "酸奶", "面包", "蛋", "奶酪", "milk", "yogurt", "bread", "egg", "cheese", "dairy"] },
  { key: "daily", zh: "日用百货", en: "Household", emoji: "🧻", keywords: ["纸巾", "洗衣", "牙膏", "洗发", "日用", "tissue", "detergent", "toothpaste", "shampoo", "household"] },
  { key: "fresh", zh: "生鲜果蔬", en: "Fresh Produce", emoji: "🥬", keywords: ["蔬菜", "水果", "生鲜", "豆腐", "vegetable", "fruit", "fresh", "produce", "tofu"] },
  { key: "beer", zh: "酒水", en: "Beer, Wine & Spirits", emoji: "🍺", keywords: ["啤酒", "红酒", "白酒", "清酒", "酒", "beer", "wine", "sake", "liquor", "alcohol"] },
];

export const categoryOf = (key: CategoryKey | undefined): CategoryDef | undefined =>
  CATEGORIES.find((c) => c.key === key);

// 模拟商品库 —— 「AI 识别」从对应品类里抽取;别名用于演示多语言/拼错/俗称搜索
export const CATALOG: CatalogProduct[] = [
  // 方便面/速食
  { id: "noodle-1", zh: "三养火鸡面", en: "Samyang Buldak Ramen", aliases: ["火鸡面", "samyang", "buldak", "huoji mian", "韩国辣面"], price: 6.5, emoji: "🍜", category: "noodle" },
  { id: "noodle-2", zh: "农心辛拉面", en: "Shin Ramyun", aliases: ["辛拉面", "shin ramyun", "nongshim", "xin lamian"], price: 5.8, emoji: "🍜", category: "noodle" },
  { id: "noodle-3", zh: "康师傅红烧牛肉面", en: "Master Kong Braised Beef Noodles", aliases: ["康师傅", "红烧牛肉面", "kangshifu", "master kong"], price: 4.5, emoji: "🍜", category: "noodle" },
  { id: "noodle-4", zh: "出前一丁麻油味", en: "Demae Ramen Sesame Oil", aliases: ["出前一丁", "demae itcho", "chuqian yiding"], price: 5.0, emoji: "🍜", category: "noodle" },
  { id: "noodle-5", zh: "合味道杯面海鲜味", en: "Cup Noodles Seafood", aliases: ["合味道", "杯面", "cup noodles", "nissin", "日清"], price: 6.0, emoji: "🥡", category: "noodle" },
  { id: "noodle-6", zh: "好欢螺螺蛳粉", en: "Haohuanluo Luosifen", aliases: ["螺蛳粉", "luosifen", "snail noodles", "柳州螺蛳粉"], price: 12.9, emoji: "🍝", category: "noodle" },
  // 调味酱料
  { id: "sauce-1", zh: "老干妈油辣椒", en: "Lao Gan Ma Chili Crisp", aliases: ["老干妈", "laoganma", "lao gan ma", "chili crisp", "油辣椒", "辣椒酱"], price: 9.9, emoji: "🌶️", category: "sauce" },
  { id: "sauce-2", zh: "海天生抽", en: "Haday Light Soy Sauce", aliases: ["生抽", "酱油", "haitian", "soy sauce", "soya"], price: 8.5, emoji: "🍶", category: "sauce" },
  { id: "sauce-3", zh: "李锦记蚝油", en: "Lee Kum Kee Oyster Sauce", aliases: ["蚝油", "李锦记", "oyster sauce", "oister sauce", "haoyou"], price: 12.0, emoji: "🦪", category: "sauce" },
  { id: "sauce-4", zh: "韩式辣椒酱", en: "Gochujang", aliases: ["辣椒酱", "韩国辣酱", "gochujang", "kochujang"], price: 15.8, emoji: "🥫", category: "sauce" },
  { id: "sauce-5", zh: "纯芝麻香油", en: "Pure Sesame Oil", aliases: ["香油", "麻油", "芝麻油", "sesame oil", "zhima you"], price: 13.5, emoji: "🫙", category: "sauce" },
  { id: "sauce-6", zh: "镇江香醋", en: "Zhenjiang Black Vinegar", aliases: ["香醋", "陈醋", "黑醋", "vinegar", "chinkiang"], price: 6.8, emoji: "🍾", category: "sauce" },
  // 零食饼干
  { id: "snack-1", zh: "格力高百奇巧克力", en: "Pocky Chocolate", aliases: ["百奇", "pocky", "百力滋", "饼干棒"], price: 7.5, emoji: "🍫", category: "snack" },
  { id: "snack-2", zh: "乐事原味薯片", en: "Lay's Classic Chips", aliases: ["乐事", "薯片", "lays", "chips", "potato chips"], price: 8.0, emoji: "🥔", category: "snack" },
  { id: "snack-3", zh: "旺旺雪饼", en: "Want Want Rice Crackers", aliases: ["旺旺", "雪饼", "want want", "米饼"], price: 6.5, emoji: "🍘", category: "snack" },
  { id: "snack-4", zh: "好丽友巧克力派", en: "Orion Choco Pie", aliases: ["好丽友", "巧克力派", "choco pie", "orion"], price: 9.9, emoji: "🥧", category: "snack" },
  { id: "snack-5", zh: "上好佳鲜虾条", en: "Oishi Shrimp Crackers", aliases: ["虾条", "上好佳", "shrimp chips", "虾片"], price: 4.5, emoji: "🍤", category: "snack" },
  { id: "snack-6", zh: "波力海苔", en: "Bolo Seaweed Snack", aliases: ["海苔", "紫菜", "seaweed", "nori", "海苔片"], price: 5.5, emoji: "🟩", category: "snack" },
  // 饮料冲调
  { id: "drink-1", zh: "可口可乐", en: "Coca-Cola", aliases: ["可乐", "coke", "cola", "kele"], price: 3.5, emoji: "🥤", category: "drink" },
  { id: "drink-2", zh: "养乐多", en: "Yakult", aliases: ["yakult", "益力多", "乳酸菌", "yangleduo"], price: 11.0, emoji: "🧃", category: "drink" },
  { id: "drink-3", zh: "王老吉凉茶", en: "Wanglaoji Herbal Tea", aliases: ["王老吉", "凉茶", "herbal tea", "wanglaoji"], price: 4.0, emoji: "🥫", category: "drink" },
  { id: "drink-4", zh: "维他柠檬茶", en: "Vita Lemon Tea", aliases: ["柠檬茶", "维他", "vita", "lemon tea"], price: 4.5, emoji: "🍋", category: "drink" },
  { id: "drink-5", zh: "椰树椰汁", en: "Yeshu Coconut Milk", aliases: ["椰汁", "椰奶", "coconut", "yeshu", "椰树"], price: 6.0, emoji: "🥥", category: "drink" },
  { id: "drink-6", zh: "农夫山泉", en: "Nongfu Spring Water", aliases: ["矿泉水", "水", "water", "nongfu", "农夫"], price: 2.0, emoji: "💧", category: "drink" },
  // 冷冻食品
  { id: "frozen-1", zh: "湾仔码头三鲜水饺", en: "Wanchai Ferry Dumplings", aliases: ["水饺", "饺子", "湾仔码头", "dumplings", "jiaozi"], price: 22.9, emoji: "🥟", category: "frozen" },
  { id: "frozen-2", zh: "思念黑芝麻汤圆", en: "Synear Black Sesame Tangyuan", aliases: ["汤圆", "元宵", "tangyuan", "思念", "rice ball"], price: 13.9, emoji: "⚪", category: "frozen" },
  { id: "frozen-3", zh: "安井鱼豆腐", en: "Anjoy Fish Tofu", aliases: ["鱼豆腐", "fish tofu", "火锅丸子", "丸子"], price: 15.5, emoji: "🍢", category: "frozen" },
  { id: "frozen-4", zh: "广式虾饺", en: "Cantonese Har Gow", aliases: ["虾饺", "har gow", "点心", "dimsum"], price: 25.0, emoji: "🦐", category: "frozen" },
  { id: "frozen-5", zh: "梦龙香草冰淇淋", en: "Magnum Vanilla Ice Cream", aliases: ["冰淇淋", "雪糕", "梦龙", "ice cream", "magnum"], price: 8.5, emoji: "🍦", category: "frozen" },
  { id: "frozen-6", zh: "速冻烤冷面", en: "Frozen Grilled Cold Noodles", aliases: ["烤冷面", "冷面", "kaolengmian"], price: 9.9, emoji: "🫓", category: "frozen" },
  // 米面粮油
  { id: "grain-1", zh: "五常大米", en: "Wuchang Rice", aliases: ["大米", "米", "rice", "东北大米", "wuchang"], price: 39.9, emoji: "🍚", category: "grain" },
  { id: "grain-2", zh: "金龙鱼花生油", en: "Arawana Peanut Oil", aliases: ["花生油", "食用油", "金龙鱼", "peanut oil", "cooking oil"], price: 69.9, emoji: "🛢️", category: "grain" },
  { id: "grain-3", zh: "陈克明挂面", en: "Chenkeming Dried Noodles", aliases: ["挂面", "面条", "dried noodles", "面"], price: 5.5, emoji: "🍝", category: "grain" },
  { id: "grain-4", zh: "糯米", en: "Glutinous Rice", aliases: ["糯米", "江米", "sticky rice", "glutinous"], price: 12.0, emoji: "🌾", category: "grain" },
  { id: "grain-5", zh: "中筋面粉", en: "All-Purpose Flour", aliases: ["面粉", "flour", "中筋粉"], price: 8.9, emoji: "🥡", category: "grain" },
  { id: "grain-6", zh: "红豆", en: "Red Beans", aliases: ["红豆", "赤豆", "red bean", "adzuki"], price: 9.5, emoji: "🫘", category: "grain" },
  // 乳品烘焙
  { id: "dairy-1", zh: "蒙牛纯牛奶", en: "Mengniu Pure Milk", aliases: ["牛奶", "纯奶", "milk", "蒙牛", "mengniu"], price: 3.5, emoji: "🥛", category: "dairy" },
  { id: "dairy-2", zh: "安慕希希腊酸奶", en: "Ambrosial Greek Yogurt", aliases: ["酸奶", "安慕希", "yogurt", "yoghurt"], price: 6.5, emoji: "🍶", category: "dairy" },
  { id: "dairy-3", zh: "曼可顿吐司面包", en: "Mankattan Toast Bread", aliases: ["吐司", "面包", "toast", "bread", "切片面包"], price: 9.9, emoji: "🍞", category: "dairy" },
  { id: "dairy-4", zh: "总统淡味黄油", en: "President Butter", aliases: ["黄油", "butter", "牛油"], price: 32.0, emoji: "🧈", category: "dairy" },
  { id: "dairy-5", zh: "新鲜鸡蛋 30 枚", en: "Fresh Eggs 30pk", aliases: ["鸡蛋", "蛋", "eggs", "egg"], price: 18.9, emoji: "🥚", category: "dairy" },
  { id: "dairy-6", zh: "芝士片", en: "Cheese Slices", aliases: ["芝士", "奶酪", "cheese", "起司"], price: 15.5, emoji: "🧀", category: "dairy" },
  // 日用百货
  { id: "daily-1", zh: "维达抽纸", en: "Vinda Facial Tissue", aliases: ["抽纸", "纸巾", "tissue", "维达", "餐巾纸"], price: 12.9, emoji: "🧻", category: "daily" },
  { id: "daily-2", zh: "蓝月亮洗衣液", en: "Bluemoon Laundry Detergent", aliases: ["洗衣液", "蓝月亮", "detergent", "laundry"], price: 29.9, emoji: "🧴", category: "daily" },
  { id: "daily-3", zh: "云南白药牙膏", en: "Yunnan Baiyao Toothpaste", aliases: ["牙膏", "toothpaste", "云南白药"], price: 26.5, emoji: "🪥", category: "daily" },
  { id: "daily-4", zh: "海飞丝洗发水", en: "Head & Shoulders Shampoo", aliases: ["洗发水", "海飞丝", "shampoo", "去屑"], price: 35.0, emoji: "🧴", category: "daily" },
  { id: "daily-5", zh: "垃圾袋 100 只", en: "Trash Bags 100pk", aliases: ["垃圾袋", "trash bag", "garbage bag"], price: 9.9, emoji: "🗑️", category: "daily" },
  { id: "daily-6", zh: "南孚 5 号电池", en: "Nanfu AA Batteries", aliases: ["电池", "5号电池", "battery", "aa"], price: 14.5, emoji: "🔋", category: "daily" },
  // 生鲜果蔬
  { id: "fresh-1", zh: "大白菜", en: "Napa Cabbage", aliases: ["白菜", "cabbage", "napa", "黄芽白"], price: 3.9, emoji: "🥬", category: "fresh" },
  { id: "fresh-2", zh: "香蕉", en: "Bananas", aliases: ["banana", "香蕉"], price: 5.5, emoji: "🍌", category: "fresh" },
  { id: "fresh-3", zh: "红富士苹果", en: "Fuji Apples", aliases: ["苹果", "apple", "富士"], price: 8.9, emoji: "🍎", category: "fresh" },
  { id: "fresh-4", zh: "小葱", en: "Green Onions", aliases: ["葱", "香葱", "scallion", "green onion"], price: 2.5, emoji: "🌿", category: "fresh" },
  { id: "fresh-5", zh: "嫩豆腐", en: "Soft Tofu", aliases: ["豆腐", "tofu", "嫩豆腐"], price: 4.5, emoji: "⬜", category: "fresh" },
  { id: "fresh-6", zh: "香菜", en: "Cilantro", aliases: ["香菜", "芫荽", "cilantro", "coriander"], price: 2.0, emoji: "🌱", category: "fresh" },
  // 酒水
  { id: "beer-1", zh: "青岛啤酒", en: "Tsingtao Beer", aliases: ["青岛", "啤酒", "tsingtao", "beer"], price: 6.0, emoji: "🍺", category: "beer" },
  { id: "beer-2", zh: "长城干红葡萄酒", en: "Great Wall Red Wine", aliases: ["红酒", "葡萄酒", "wine", "长城"], price: 68.0, emoji: "🍷", category: "beer" },
  { id: "beer-3", zh: "月桂冠清酒", en: "Gekkeikan Sake", aliases: ["清酒", "sake", "日本酒"], price: 88.0, emoji: "🍶", category: "beer" },
  { id: "beer-4", zh: "红星二锅头", en: "Red Star Erguotou", aliases: ["二锅头", "白酒", "erguotou", "baijiu"], price: 25.0, emoji: "🥃", category: "beer" },
  { id: "beer-5", zh: "燕京啤酒", en: "Yanjing Beer", aliases: ["燕京", "啤酒", "yanjing"], price: 4.5, emoji: "🍻", category: "beer" },
  { id: "beer-6", zh: "三得利乌龙茶酒", en: "Suntory Oolong Highball", aliases: ["三得利", "suntory", "highball", "气泡酒"], price: 12.0, emoji: "🥂", category: "beer" },
];

export const productById = (id: string): CatalogProduct | undefined =>
  CATALOG.find((p) => p.id === id);

export const productsOfCategory = (key: CategoryKey): CatalogProduct[] =>
  CATALOG.filter((p) => p.category === key);
