/**
 * TinyTrails — single-file back-end (for Replit's built-in editor).
 * Node.js + Express + MongoDB (Mongoose) + JWT + bcrypt.
 * Everything lives in this one file on purpose, so it can be pasted
 * straight into Replit without needing to upload a zip.
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

/* ============================================================
   Embedded data — menu (29 dishes, en/ku/ar) + UI translations
   ============================================================ */
const MENU_SEED = [
  {
    "id": "chili-burger",
    "quickTag": "burger",
    "name": {
      "en": "Chili Burger",
      "ku": "چیلی بەرگەر",
      "ar": "تشيلي برجر"
    },
    "price": 10250,
    "cat": "main",
    "subcat": "Beef Burgers",
    "spicy": true,
    "img": "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Chili meat",
        "Jalapeno",
        "Onion",
        "Cheddar cheese",
        "Mozzarella cheese"
      ],
      "ku": [
        "گۆشتی چیلی",
        "هەلەبینۆ",
        "پیاز",
        "پەنیری چێدەر",
        "پەنیری مۆزەریلا"
      ],
      "ar": [
        "لحمة تشيلي",
        "هلابينو",
        "بصل",
        "جبنة شيدر",
        "جبنة موزاريلا"
      ]
    }
  },
  {
    "id": "hummer-burger",
    "quickTag": "burger",
    "name": {
      "en": "Hummer Burger",
      "ku": "هەمەر بەرگەر",
      "ar": "همر برجر"
    },
    "price": 13250,
    "cat": "main",
    "subcat": "Beef Burgers",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1700835880402-434acb82fca9?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "99 sauce",
        "BBQ sauce",
        "Creamy mushroom & onion sauce",
        "Ranch sauce",
        "Smoked cheese",
        "cheddar & swiss cheese",
        "Caramelized onion",
        "Beef bacon",
        "Turkey",
        "Tomato",
        "Lettuce",
        "Pickles"
      ],
      "ku": [
        "سۆسی ٩٩",
        "سۆسی باربیکیو",
        "سۆسی قارچک و پیازی کرێمی",
        "سۆسی ڕانچ",
        "پەنیری دووکەڵی و چێدەر و سویسی",
        "پیازی کارامێلکراو",
        "بەیکەنی گۆشت",
        "تورکی",
        "تەماتە",
        "خس",
        "خیارشوور"
      ],
      "ar": [
        "صوص 99",
        "باربكيو",
        "صوص المشروم والبصل",
        "رانش",
        "جبنة مدخنة وشيدر وسويسرية",
        "بصل مكرمل",
        "بيكون بقري",
        "تركي",
        "طماطم",
        "خس",
        "مخلل"
      ]
    }
  },
  {
    "id": "pingo-burger",
    "quickTag": "burger",
    "name": {
      "en": "Pingo Burger",
      "ku": "پینگۆ بەرگەر",
      "ar": "بينجو برجر"
    },
    "price": 9500,
    "cat": "main",
    "subcat": "Chicken Burgers",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1636907229111-a8ac768fe6c9?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Crispy chicken",
        "Pickles",
        "Coleslaw",
        "Cheddar cheese",
        "Ranch sauce"
      ],
      "ku": [
        "مریشکی ترسکە",
        "خیارشوور",
        "کۆلسلۆ",
        "پەنیری چێدەر",
        "سۆسی ڕانچ"
      ],
      "ar": [
        "دجاج مقرمش",
        "مخلل",
        "كولسلو",
        "جبنة شيدر",
        "رانش صوص"
      ]
    }
  },
  {
    "id": "pavillion-burger",
    "quickTag": "burger",
    "name": {
      "en": "Pavillion Burger",
      "ku": "پافیلیۆن بەرگەر",
      "ar": "بافيليون برجر"
    },
    "price": 9500,
    "cat": "main",
    "subcat": "Chicken Burgers",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1610150157941-f7bcc26f8914?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Crispy chicken",
        "Nashville sauce",
        "Pickles",
        "Coleslaw",
        "Cheddar cheese",
        "Ranch sauce"
      ],
      "ku": [
        "مریشکی ترسکە",
        "سۆسی نەشڤیل",
        "خیارشوور",
        "کۆلسلۆ",
        "پەنیری چێدەر",
        "سۆسی ڕانچ"
      ],
      "ar": [
        "دجاج مقرمش",
        "ناشفيل صوص",
        "مخلل",
        "كولسلو",
        "جبنة شيدر",
        "رانش صوص"
      ]
    }
  },
  {
    "id": "firegrill-burger",
    "quickTag": "burger",
    "name": {
      "en": "FireGrill",
      "ku": "فایەرگریل بەرگەر",
      "ar": "فاير جريل برجر"
    },
    "price": 9500,
    "cat": "main",
    "subcat": "Chicken Burgers",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1561758033-563f9666b8c8?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Grilled chicken",
        "Tomato",
        "Pickles",
        "Cheddar cheese",
        "Lettuce",
        "Ranch sauce"
      ],
      "ku": [
        "مریشکی برژاو",
        "تەماتە",
        "خیارشوور",
        "پەنیری چێدەر",
        "خس",
        "سۆسی ڕانچ"
      ],
      "ar": [
        "دجاج مشوي",
        "طماطم",
        "مخلل",
        "جبنة شيدر",
        "خس",
        "رانش صوص"
      ]
    }
  },
  {
    "id": "swiss-mushroom",
    "quickTag": "burger",
    "name": {
      "en": "Swiss Mushroom",
      "ku": "سویس ماشرووم",
      "ar": "سويس ماشروم"
    },
    "price": 9500,
    "cat": "main",
    "subcat": "Chicken Burgers",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1636907229111-a8ac768fe6c9?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Grilled chicken",
        "Creamy mushroom & onion sauce",
        "Mozzarella cheese",
        "Swiss cheese",
        "Mayo"
      ],
      "ku": [
        "مریشکی برژاو",
        "سۆسی قارچک و پیازی کرێمی",
        "پەنیری مۆزەریلا",
        "پەنیری سویسی",
        "مایۆنێز"
      ],
      "ar": [
        "دجاج مشوي",
        "صوص المشروم والبصل",
        "جبنة موزاريلا",
        "جبنة سويسرية",
        "مايونيز"
      ]
    }
  },
  {
    "id": "crunchy-chicken",
    "quickTag": "burger",
    "name": {
      "en": "Crunchy Chicken",
      "ku": "کرەنچی مریشک",
      "ar": "كرنشي تشيكن"
    },
    "price": 9500,
    "cat": "main",
    "subcat": "Chicken Burgers",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1610150157941-f7bcc26f8914?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Crispy chicken",
        "Tomato",
        "Pickles",
        "Cheddar cheese",
        "Lettuce"
      ],
      "ku": [
        "مریشکی ترسکە",
        "تەماتە",
        "خیارشوور",
        "پەنیری چێدەر",
        "خس"
      ],
      "ar": [
        "دجاج مقرمش",
        "طماطم",
        "مخلل",
        "جبنة شيدر",
        "خس"
      ]
    }
  },
  {
    "id": "beef-box",
    "quickTag": "burger",
    "name": {
      "en": "Beef Box",
      "ku": "بۆکسی گۆشت",
      "ar": "بوكس لحم"
    },
    "price": 7500,
    "cat": "main",
    "subcat": "Boxes",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1667329829058-ac191ba4a905?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Beef",
        "Light cheese",
        "Lettuce",
        "Fresh onion",
        "Tomato",
        "Pickles",
        "Light mayo",
        "Red cabbage"
      ],
      "ku": [
        "گۆشتی مانگا",
        "پەنیری سووک",
        "خس",
        "پیازی تازە",
        "تەماتە",
        "خیارشوور",
        "مایۆنێزی سووک",
        "کەلەرمی سوور"
      ],
      "ar": [
        "لحم بقري",
        "جبنة لايت",
        "خس",
        "طماطم",
        "مخلل",
        "مايونيز لايت",
        "ملفوف أحمر"
      ]
    }
  },
  {
    "id": "chicken-box",
    "quickTag": "burger",
    "name": {
      "en": "Chicken Box",
      "ku": "بۆکسی مریشک",
      "ar": "بوكس دجاج"
    },
    "price": 6500,
    "cat": "main",
    "subcat": "Boxes",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1561758033-563f9666b8c8?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Grilled chicken",
        "Light cheese",
        "Fresh onion",
        "Lettuce",
        "Tomato",
        "Pickles",
        "Light mayo",
        "Red cabbage"
      ],
      "ku": [
        "مریشکی برژاو",
        "پەنیری سووک",
        "پیازی تازە",
        "خس",
        "تەماتە",
        "خیارشوور",
        "مایۆنێزی سووک",
        "کەلەرمی سوور"
      ],
      "ar": [
        "دجاج مشوي",
        "جبنة لايت",
        "طماطم",
        "خس",
        "مخلل",
        "مايونيز لايت",
        "ملفوف أحمر"
      ]
    }
  },
  {
    "id": "warm-lafa-wrap",
    "quickTag": "snacks",
    "name": {
      "en": "Warm Lafa Wrap",
      "ku": "لەفەی گەرم",
      "ar": "لەفەی گەرم"
    },
    "price": 8500,
    "cat": "main",
    "subcat": "Wraps",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Grilled beef or chicken",
        "Warm lafa bread",
        "Grilled onions & peppers",
        "Garlic sauce",
        "Pickles"
      ],
      "ku": [
        "گۆشتی مانگا یان مریشکی برژاو",
        "نانی لەفەی گەرم",
        "بیبەر و پیازی برژاو",
        "سۆسی سیر",
        "خیارشوور"
      ],
      "ar": [
        "گۆشتی مانگا یان مریشکی برژاو",
        "نانی لەفەی گەرم",
        "بیبەر و پیازی برژاو",
        "سۆسی سیر",
        "خیارشوور"
      ]
    }
  },
  {
    "id": "cold-lafa-wrap",
    "quickTag": "snacks",
    "name": {
      "en": "Cold Lafa Wrap",
      "ku": "لەفەی سارد",
      "ar": "لەفەی سارد"
    },
    "price": 7000,
    "cat": "main",
    "subcat": "Wraps",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1719282431723-9d0f4370d4bc?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Cold cuts",
        "Lafa bread",
        "Lettuce",
        "Tomato",
        "Mayo",
        "Cheddar cheese"
      ],
      "ku": [
        "گۆشتی سارد",
        "نانی لەفە",
        "خس",
        "تەماتە",
        "مایۆنێز",
        "پەنیری چێدەر"
      ],
      "ar": [
        "گۆشتی سارد",
        "نانی لەفە",
        "خس",
        "تەماتە",
        "مایۆنێز",
        "جبنة شیدر"
      ]
    }
  },
  {
    "id": "chicken-tikka",
    "quickTag": "chicken",
    "name": {
      "en": "Chicken Tikka",
      "ku": "تیکەی مریشک",
      "ar": "تكة دجاج"
    },
    "price": 15000,
    "cat": "main",
    "subcat": "Chef's Kitchen",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1633945274309-2ce0d59e1af8?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Chicken thigh",
        "Yogurt marinade",
        "Garam masala",
        "Lemon juice",
        "Grilled peppers"
      ],
      "ku": [
        "سنگی مریشک",
        "مەریناتی ماست",
        "بەهاراتی گەرام ماسالا",
        "شیری لیمۆ",
        "بیبەری برژاو"
      ],
      "ar": [
        "صدر دجاج",
        "تتبيلة اللبن",
        "بهارات غرام ماسالا",
        "عصير ليمون",
        "فلفل مشوي"
      ]
    }
  },
  {
    "id": "spaghetti-carbonara",
    "quickTag": "snacks",
    "name": {
      "en": "Spaghetti Carbonara",
      "ku": "سپاگێتی کاربۆنارا",
      "ar": "سباغيتي كاربونارا"
    },
    "price": 17000,
    "cat": "main",
    "subcat": "Chef's Kitchen",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Spaghetti",
        "Pancetta",
        "Egg yolk",
        "Parmesan cheese",
        "Black pepper"
      ],
      "ku": [
        "سپاگێتی",
        "گۆشتی پانچێتا",
        "زەردەی هێلکە",
        "پەنیری پارمیزان",
        "بیبەری ڕەش"
      ],
      "ar": [
        "سباغيتي",
        "لحم بانشيتا",
        "صفار بيض",
        "جبنة بارميزان",
        "فلفل أسود"
      ]
    }
  },
  {
    "id": "lamb-rogan-josh",
    "quickTag": "snacks",
    "name": {
      "en": "Lamb Rogan Josh",
      "ku": "لامب ڕۆگان جۆش",
      "ar": "لحم روغان جوش"
    },
    "price": 16000,
    "cat": "main",
    "subcat": "Chef's Kitchen",
    "spicy": true,
    "img": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Lamb chunks",
        "Kashmiri chili",
        "Yogurt",
        "Onion",
        "Garam masala"
      ],
      "ku": [
        "پارچە گۆشتی بەران",
        "بیبەری کەشمیری",
        "ماست",
        "پیاز",
        "بەهاراتی گەرام ماسالا"
      ],
      "ar": [
        "قطع لحم غنم",
        "فلفل كشميري",
        "لبن",
        "بصل",
        "بهارات غرام ماسالا"
      ]
    }
  },
  {
    "id": "margherita-pizza",
    "quickTag": "pizza",
    "name": {
      "en": "Margherita Pizza",
      "ku": "پیتزای مارگەریتا",
      "ar": "بيتزا مارغريتا"
    },
    "price": 12500,
    "cat": "main",
    "subcat": "Chef's Kitchen",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1649688423692-308d2fc1027d?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Pizza dough",
        "Tomato sauce",
        "Fresh mozzarella",
        "Basil leaves",
        "Olive oil"
      ],
      "ku": [
        "هەویری پیتزا",
        "سۆسی تەماتە",
        "مۆزەریلای تازە",
        "گەڵای ڕەیحان",
        "زەیتی زەیتوون"
      ],
      "ar": [
        "عجينة بيتزا",
        "صوص طماطم",
        "جبنة موزاريلا طازجة",
        "ريحان",
        "زيت زيتون"
      ]
    }
  },
  {
    "id": "chicken-paella",
    "quickTag": "chicken",
    "name": {
      "en": "Chicken Paella",
      "ku": "پایێلای مریشک",
      "ar": "بايلا دجاج"
    },
    "price": 16500,
    "cat": "main",
    "subcat": "Chef's Kitchen",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1604543519952-12b7038886c0?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Saffron rice",
        "Chicken thigh",
        "Bell peppers",
        "Green peas",
        "Paprika"
      ],
      "ku": [
        "برنجی زەعفەران",
        "سنگی مریشک",
        "بیبەری ڕەنگاوڕەنگ",
        "نۆکی سەوز",
        "پاپریکا"
      ],
      "ar": [
        "رز الزعفران",
        "صدر دجاج",
        "فليفلة ملونة",
        "بازيلاء",
        "بابريكا"
      ]
    }
  },
  {
    "id": "seafood-paella",
    "quickTag": "snacks",
    "name": {
      "en": "Seafood Paella",
      "ku": "پایێلای شێلاندن",
      "ar": "بايلا بحرية"
    },
    "price": 18500,
    "cat": "main",
    "subcat": "Chef's Kitchen",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1623961990059-28356e226a77?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Saffron rice",
        "Shrimp",
        "Mussels",
        "Squid",
        "Lemon"
      ],
      "ku": [
        "برنجی زەعفەران",
        "میگۆ",
        "سیفی دەریایی",
        "کاتکاتۆک",
        "لیمۆ"
      ],
      "ar": [
        "رز الزعفران",
        "شريمب",
        "بلح البحر",
        "حبار",
        "ليمون"
      ]
    }
  },
  {
    "id": "caesar-salad",
    "quickTag": "snacks",
    "name": {
      "en": "Caesar Salad",
      "ku": "زەڵاتەی سیزەر",
      "ar": "سلطة سيزر"
    },
    "price": 6500,
    "cat": "starters",
    "subcat": "Salads",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1556386734-4227a180d19e?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Lettuce",
        "Crouton",
        "Caesar sauce",
        "Parmesan cheese",
        "Grilled chicken pieces"
      ],
      "ku": [
        "خس",
        "نانی برژاو",
        "سۆسی سیزەر",
        "پەنیری پارمیزان",
        "پارچە مریشکی برژاو"
      ],
      "ar": [
        "خس",
        "خبز محمص",
        "صلصة السيزر",
        "جبنة بارميزان",
        "قطع دجاج مشوي"
      ]
    }
  },
  {
    "id": "honey-crunch-salad",
    "quickTag": "snacks",
    "name": {
      "en": "Honey Crunch",
      "ku": "هەنی کرەنچ",
      "ar": "سلطة هني كرنش"
    },
    "price": 7750,
    "cat": "starters",
    "subcat": "Salads",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1556386734-4227a180d19e?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Lettuce",
        "Crouton",
        "Honey mustard sauce",
        "Parmesan cheese",
        "Turkey",
        "Fried chicken pieces"
      ],
      "ku": [
        "خس",
        "نانی برژاو",
        "سۆسی هەنی ماستەرد",
        "پەنیری پارمیزان",
        "تورکی",
        "پارچە مریشکی سوورکراو"
      ],
      "ar": [
        "خس",
        "خبز محمص",
        "صوص الهني ماسترد",
        "جبنة بارميزان",
        "تيركي",
        "قطع الدجاج المقلي"
      ]
    }
  },
  {
    "id": "garden-salad",
    "quickTag": "snacks",
    "name": {
      "en": "Garden Salad",
      "ku": "زەڵاتەی باخچە",
      "ar": "زەڵاتەی باخچە"
    },
    "price": 5500,
    "cat": "starters",
    "subcat": "Salads",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1594470303906-fbd63d3d3f47?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Mixed greens",
        "Cucumber",
        "Tomato",
        "Red onion",
        "Olive oil",
        "Lemon dressing"
      ],
      "ku": [
        "خس و سەوزەی تازە",
        "خیار",
        "تەماتە",
        "پیازی سوور",
        "زەیتی زەیتوون",
        "لیمۆ"
      ],
      "ar": [
        "خس و سەوزە تازە",
        "خیار",
        "تەماتە",
        "پیازی سوور",
        "زەیتی زەیتون",
        "لیمۆن"
      ]
    }
  },
  {
    "id": "crispy-samosas",
    "quickTag": "snacks",
    "name": {
      "en": "Crispy Samosas",
      "ku": "سامۆسای ترسکە",
      "ar": "سمبوسة مقرمشة"
    },
    "price": 5000,
    "cat": "starters",
    "subcat": "Salads",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Pastry shell",
        "Spiced potato filling",
        "Green peas",
        "Cumin seeds",
        "Tamarind chutney"
      ],
      "ku": [
        "هەویری ترسکە",
        "پڕکراوی پەتاتەی بەهاراتدار",
        "نۆکی سەوز",
        "تۆوی زیرە",
        "سۆسی تەمر هیندی"
      ],
      "ar": [
        "عجينة مقرمشة",
        "حشوة بطاطا متبلة",
        "بازيلاء",
        "كمون",
        "صوص التمر هندي"
      ]
    }
  },
  {
    "id": "boneless",
    "quickTag": "chicken",
    "name": {
      "en": "Boneless",
      "ku": "بۆنلێس",
      "ar": "بونليس"
    },
    "price": 6500,
    "cat": "starters",
    "subcat": "Boneless & Wings",
    "spicy": true,
    "img": "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Boneless chicken bites",
        "Choice of flavor: Buffalo",
        "BBQ",
        "Honey Mustard",
        "Sweet Chili",
        "Honey BBQ",
        "Garlic Parmesan",
        "Garlic Lemon",
        "or Melted Cheese"
      ],
      "ku": [
        "پارچە مریشکی بێ ئێسک",
        "تامێک هەڵبژێرە: بافلۆ",
        "باربیکیو",
        "هەنی ماستەرد",
        "سویت چیلی",
        "هەنی باربیکیو",
        "سیری پارمیزان",
        "سیری لیمۆ",
        "یان پەنیری تواوە"
      ],
      "ar": [
        "قطع دجاج بونليس",
        "اختر النكهة: بافلو",
        "باربكيو",
        "هني ماسترد",
        "سويت شيلي",
        "هني باربكيو",
        "جارلك بارميزان",
        "جارلك ليمون",
        "أو جبنة ذائبة"
      ]
    }
  },
  {
    "id": "wings",
    "quickTag": "chicken",
    "name": {
      "en": "Wings",
      "ku": "باڵی مریشک",
      "ar": "اجنحة"
    },
    "price": 9750,
    "cat": "starters",
    "subcat": "Boneless & Wings",
    "spicy": true,
    "img": "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Chicken wings (12 pcs)",
        "Choice of flavor: Buffalo",
        "BBQ",
        "Honey Mustard",
        "Sweet Chili",
        "Honey BBQ",
        "Garlic Parmesan",
        "Garlic Lemon",
        "or Melted Cheese"
      ],
      "ku": [
        "باڵی مریشک (١٢ پارچە)",
        "تامێک هەڵبژێرە: بافلۆ",
        "باربیکیو",
        "هەنی ماستەرد",
        "سویت چیلی",
        "هەنی باربیکیو",
        "سیری پارمیزان",
        "سیری لیمۆ",
        "یان پەنیری تواوە"
      ],
      "ar": [
        "اجنحة دجاج (12 قطعة)",
        "اختر النكهة: بافلو",
        "باربكيو",
        "هني ماسترد",
        "سويت شيلي",
        "هني باربكيو",
        "جارلك بارميزان",
        "جارلك ليمون",
        "أو جبنة ذائبة"
      ]
    }
  },
  {
    "id": "french-fries",
    "quickTag": "snacks",
    "name": {
      "en": "French Fries",
      "ku": "پەتاتەی سووراو",
      "ar": "بطاطا فرايز"
    },
    "price": 2250,
    "cat": "starters",
    "subcat": "Appetizers",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1609428079875-ae186c562aff?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Potatoes",
        "Salt"
      ],
      "ku": [
        "پەتاتە",
        "خوێ"
      ],
      "ar": [
        "بطاطا",
        "ملح"
      ]
    }
  },
  {
    "id": "chocolate-cake",
    "quickTag": "dessert",
    "name": {
      "en": "Chocolate Cake",
      "ku": "کێکی شۆکولاتە",
      "ar": "كيك شوكولاتة"
    },
    "price": 6000,
    "cat": "desserts",
    "subcat": "Cakes",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1588195542907-a0c0a2ac3312?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Chocolate sponge",
        "Fudge frosting",
        "Chocolate shavings"
      ],
      "ku": [
        "ئەسفەنجی شۆکولاتە",
        "کرێمی فەج",
        "تراشەی شۆکولاتە"
      ],
      "ar": [
        "كيك شوكولاتة",
        "كريمة فادج",
        "رقائق شوكولاتة"
      ]
    }
  },
  {
    "id": "lava-cake",
    "quickTag": "dessert",
    "name": {
      "en": "Lava Cake",
      "ku": "لاڤا کێک",
      "ar": "لافا كيك"
    },
    "price": 6500,
    "cat": "desserts",
    "subcat": "Cakes",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1588195542907-a0c0a2ac3312?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Dark chocolate",
        "Butter",
        "Eggs",
        "Flour",
        "Vanilla ice cream"
      ],
      "ku": [
        "شۆکولاتەی تاریک",
        "کەرە",
        "هێلکە",
        "ئارد",
        "ئایسکرێمی ڤانیلا"
      ],
      "ar": [
        "شوكولاتة داكنة",
        "زبدة",
        "بيض",
        "طحين",
        "آيسكريم فانيلا"
      ]
    }
  },
  {
    "id": "mojito",
    "quickTag": "drinks",
    "name": {
      "en": "Classic Mojito",
      "ku": "مۆهیتۆی کلاسیک",
      "ar": "موهيتو"
    },
    "price": 5000,
    "cat": "beverages",
    "subcat": "Other Drinks",
    "spicy": false,
    "img": "https://images.unsplash.com/photo-1753263453239-fef8e92b5040?w=600&q=80&auto=format&fit=crop",
    "ingredients": {
      "en": [
        "Fresh lime",
        "Mint leaves",
        "Sugar syrup",
        "Soda water"
      ],
      "ku": [
        "لیمۆی تازە",
        "پەپەنگ",
        "شەربەتی شەکر",
        "ئاوی سۆدا"
      ],
      "ar": [
        "ليمون طازج",
        "نعناع",
        "شراب سكر",
        "صودا"
      ]
    }
  },
  {
    "id": "sharbat",
    "quickTag": "drinks",
    "name": {
      "en": "Fruit Sharbat",
      "ku": "شەربەتی میوە",
      "ar": "شربات فواكه"
    },
    "price": 3500,
    "cat": "beverages",
    "subcat": "Other Drinks",
    "spicy": false,
    "emoji": "🧃",
    "ingredients": {
      "en": [
        "Fruit syrup (rose or mixed berry)",
        "Cold water",
        "Ice",
        "Sugar"
      ],
      "ku": [
        "شەربەتی میوە (گوڵ یان میوەی تێکەڵ)",
        "ئاوی سارد",
        "سەهۆڵ",
        "شەکر"
      ],
      "ar": [
        "شراب الفواكه (ورد أو توت مشكل)",
        "ماء بارد",
        "ثلج",
        "سكر"
      ]
    }
  },
  {
    "id": "dogh",
    "quickTag": "drinks",
    "name": {
      "en": "Dogh (Yogurt Drink)",
      "ku": "دۆغ (خواردنەوەی ماست)",
      "ar": "دوغ (مشروب اللبن)"
    },
    "price": 3000,
    "cat": "beverages",
    "subcat": "Other Drinks",
    "spicy": false,
    "emoji": "🥛",
    "ingredients": {
      "en": [
        "Yogurt",
        "Cold water",
        "Salt",
        "Dried mint"
      ],
      "ku": [
        "ماست",
        "ئاوی سارد",
        "خوێ",
        "پونگی وشک"
      ],
      "ar": [
        "لبن",
        "ماء بارد",
        "ملح",
        "نعناع مجفف"
      ]
    }
  }
];

const TRANSLATIONS = {
  "en": {
    "nav_about": "About Us",
    "nav_programs": "Programs",
    "nav_reviews": "Reviews",
    "nav_faq": "FAQ",
    "nav_contacts": "Contacts",
    "menu_btn": "Menu",
    "back_home": "Back to Home",
    "welcome_note": "Come on in, dear — we're always open.",
    "back_to_main": "Back to Start",
    "restaurant_brand": "404 Restaurant",
    "search_placeholder": "Search dishes, drinks, desserts...",
    "feast_title": "FOODHUB FEAST",
    "feast_desc": "The flavors are stunning, freshly prepared. The presentation is a vision, the taste is flawless. Many thanks! Enjoy the meal. Order now.",
    "discover_menu": "DISCOVER MENU",
    "cat_all": "All",
    "cat_burger": "Burger",
    "cat_pizza": "Pizza",
    "cat_chicken": "Chicken",
    "cat_snacks": "Snacks",
    "cat_drinks": "Drinks",
    "cat_starters": "Starters",
    "cat_main": "Main Course",
    "cat_desserts": "Desserts",
    "cat_beverages": "Beverages",
    "no_dishes": "No dishes found",
    "no_dishes_sub": "Try a different search term or category.",
    "order_now": "Order Now",
    "ingredients": "Ingredients",
    "add_to_cart": "Add to Cart",
    "your_cart": "Your Cart",
    "cart_empty": "Your cart is empty",
    "cart_empty_sub": "Add something delicious from the menu!",
    "total": "Total",
    "proceed_checkout": "Proceed to Checkout",
    "checkout_title": "Checkout",
    "order_summary": "Order Summary",
    "grand_total": "Grand Total",
    "special_instructions": "Special Instructions",
    "notes_label": "Any notes for the kitchen? (optional)",
    "notes_placeholder": "e.g. No onions please, make it extra spicy...",
    "table_number": "Table Number",
    "table_label": "Where should we serve you?",
    "takeaway": "Takeaway",
    "back_btn": "Back",
    "place_order": "Place Order",
    "order_placed": "Order Placed!",
    "order_placed_sub": "Your order will be ready as soon as possible!",
    "great_thanks": "Great, thanks!",
    "serving_label": "Serving:",
    "offer_label": "⚡ SPECIAL OFFERS",
    "offer_title": "ENJOY 20% OFF YOUR FIRST ORDER!",
    "chef_special": "Chef's Special",
    "chef_dish_name": "Seafood Paella",
    "chef_dish_desc": "Saffron-infused rice loaded with shrimp, mussels and squid, finished with a fresh lemon wedge. A restaurant favorite, made the traditional Spanish way.",
    "deliver_to": "Order straight to your table",
    "add_to_favorites": "Add to favorites",
    "heat_label": "Heat",
    "fav_label": "Fav",
    "add_x_to_cart": "Add {name} to cart",
    "remove_x": "Remove {name}",
    "qty_label": "Qty",
    "feedback_title": "Share Your Feedback",
    "feedback_sub": "How was your experience with us?",
    "feedback_placeholder": "Tell us what you think...",
    "feedback_submit": "Send Feedback",
    "feedback_thanks": "Thanks for your feedback!",
    "feedback_need_rating": "Please choose a star rating first."
  },
  "ku": {
    "nav_about": "دەربارەمان",
    "nav_programs": "بەرنامەکان",
    "nav_reviews": "هەڵسەنگاندنەکان",
    "nav_faq": "پرسیارە باوەکان",
    "nav_contacts": "پەیوەندی",
    "menu_btn": "لیست",
    "back_home": "چوونە ژوورەوە",
    "welcome_note": "بچۆ ژوورەوە بە قوربان ئەوە دایم مەشخوڵە",
    "back_to_main": "گەڕانەوە بۆ سەرەتا",
    "restaurant_brand": "ڕێستۆرانتی 404",
    "search_placeholder": "گەڕان بۆ خواردن، خواردنەوە، شیرینی...",
    "feast_title": "خوانی تایبەت",
    "feast_desc": "تامەکان سەرسوڕهێنەرن و تازە ئامادەکراون. پێشکەشکردنەکەی چاوگیرکەرە و تامەکەی بێ کەموکوڕییە. زۆر سوپاس! خواردنەکەت بە خۆشی بخۆ. ئێستا داوا بکە.",
    "discover_menu": "بینینی مینوو",
    "cat_all": "هەموو",
    "cat_burger": "بەرگەر",
    "cat_pizza": "پیتزا",
    "cat_chicken": "مریشک",
    "cat_snacks": "خۆراکی سووک",
    "cat_drinks": "خواردنەوەکان",
    "cat_starters": "خۆراکی سەرەتا",
    "cat_main": "خواردنی سەرەکی",
    "cat_desserts": "شیرینی",
    "cat_beverages": "خواردنەوەکان",
    "no_dishes": "هیچ خواردنێک نەدۆزرایەوە",
    "no_dishes_sub": "وشەیەکی گەڕانی جیاواز یان جۆرێکی تر تاقی بکەرەوە.",
    "order_now": "ئێستا داوا بکە",
    "ingredients": "پێکهاتەکان",
    "add_to_cart": "زیادکردن بۆ سەبەتە",
    "your_cart": "سەبەتەکەت",
    "cart_empty": "سەبەتەکەت بەتاڵە",
    "cart_empty_sub": "شتێکی خۆش لە لیستەکە زیاد بکە!",
    "total": "کۆی گشتی",
    "proceed_checkout": "بەردەوامی داواکردن",
    "checkout_title": "پارەدان",
    "order_summary": "کورتەی داواکاری",
    "grand_total": "کۆی گشتی گشتگیر",
    "special_instructions": "ڕێنمایی تایبەت",
    "notes_label": "تێبینیەک بۆ چێشتخانە؟ (ئارەزوومەندانە)",
    "notes_placeholder": "بۆ نموونە: تکایە بەبێ پیاز، زیاتر تیژی بکە...",
    "table_number": "ژمارەی مێز",
    "table_label": "لەکوێ خزمەتتان بکەین؟",
    "takeaway": "بردنەوە",
    "back_btn": "گەڕانەوە",
    "place_order": "داواکاری بنێرە",
    "order_placed": "داواکاری نێردرا!",
    "order_placed_sub": "داواکاریت بە زووترین کات ئامادە دەبێت!",
    "great_thanks": "باشە، سوپاس!",
    "serving_label": "خزمەتکردن بۆ:",
    "offer_label": "⚡ ئۆفەری تایبەت",
    "offer_title": "لە یەکەم داواکاریتدا ٢٠٪ داشکاندن وەربگرە!",
    "chef_special": "تایبەتمەندی چێشتلێنەر",
    "chef_dish_name": "پایێلای شێلاندن",
    "chef_dish_desc": "برنجی زەعفەراندار پڕ لە میگۆ، سیفی دەریایی و کاتکاتۆک، لەگەڵ پارچەیەک لیمۆی تازە. دڵخوازی چێشتخانەکەیە، بە شێوازی نەریتی ئیسپانی ئامادەکراوە.",
    "deliver_to": "داواکاریت بۆ سەر مێزەکەت",
    "add_to_favorites": "زیادکردن بۆ دڵخوازەکان",
    "heat_label": "تیژی",
    "fav_label": "دڵخواز",
    "add_x_to_cart": "{name} زیاد بکە بۆ سەبەتە",
    "remove_x": "لابردنی {name}",
    "qty_label": "ژمارە",
    "feedback_title": "ڕای خۆت لەگەڵمان بڵاوبکەرەوە",
    "feedback_sub": "ئەزموونەکەت لەگەڵمان چۆن بوو؟",
    "feedback_placeholder": "ڕای خۆتمان پێ بڵێ...",
    "feedback_submit": "ناردنی ڕا",
    "feedback_thanks": "سوپاس بۆ ڕاتی!",
    "feedback_need_rating": "تکایە سەرەتا هەڵسەنگاندنێک هەڵبژێرە."
  },
  "ar": {
    "nav_about": "من نحن",
    "nav_programs": "البرامج",
    "nav_reviews": "التقييمات",
    "nav_faq": "الأسئلة الشائعة",
    "nav_contacts": "اتصل بنا",
    "menu_btn": "القائمة",
    "back_home": "العودة إلى الرئيسية",
    "welcome_note": "تفضل بالدخول عزيزي، نحن دائماً مفتوحون.",
    "back_to_main": "العودة إلى البداية",
    "restaurant_brand": "مطعم 404",
    "search_placeholder": "ابحث عن الأطباق والمشروبات والحلويات...",
    "feast_title": "مأدبة الأطباق",
    "feast_desc": "نكهات مذهلة، محضّرة طازجة. التقديم رائع والمذاق لا تشوبه شائبة. شكراً جزيلاً! استمتع بوجبتك. اطلب الآن.",
    "discover_menu": "اكتشف القائمة",
    "cat_all": "الكل",
    "cat_burger": "برجر",
    "cat_pizza": "بيتزا",
    "cat_chicken": "دجاج",
    "cat_snacks": "وجبات خفيفة",
    "cat_drinks": "المشروبات",
    "cat_starters": "المقبلات",
    "cat_main": "الطبق الرئيسي",
    "cat_desserts": "الحلويات",
    "cat_beverages": "المشروبات",
    "no_dishes": "لم يتم العثور على أي طبق",
    "no_dishes_sub": "جرّب كلمة بحث أو تصنيفاً مختلفاً.",
    "order_now": "اطلب الآن",
    "ingredients": "المكونات",
    "add_to_cart": "أضف إلى السلة",
    "your_cart": "سلة التسوق",
    "cart_empty": "سلة التسوق فارغة",
    "cart_empty_sub": "أضف شيئاً لذيذاً من القائمة!",
    "total": "الإجمالي",
    "proceed_checkout": "المتابعة للدفع",
    "checkout_title": "الدفع",
    "order_summary": "ملخص الطلب",
    "grand_total": "الإجمالي الكلي",
    "special_instructions": "تعليمات خاصة",
    "notes_label": "أي ملاحظات للمطبخ؟ (اختياري)",
    "notes_placeholder": "مثال: بدون بصل من فضلك، اجعلها حارة أكثر...",
    "table_number": "رقم الطاولة",
    "table_label": "أين نقدّم لك الطلب؟",
    "takeaway": "طلب خارجي",
    "back_btn": "رجوع",
    "place_order": "إرسال الطلب",
    "order_placed": "تم إرسال الطلب!",
    "order_placed_sub": "سيكون طلبك جاهزاً في أقرب وقت ممكن!",
    "great_thanks": "رائع، شكراً!",
    "serving_label": "التقديم لـ:",
    "offer_label": "⚡ عروض خاصة",
    "offer_title": "احصل على خصم 20% على طلبك الأول!",
    "chef_special": "طبق الشيف الخاص",
    "chef_dish_name": "بايلا المأكولات البحرية",
    "chef_dish_desc": "أرز منقوع بالزعفران محمّل بالروبيان وبلح البحر والحبار، مع شريحة ليمون طازجة. طبق مفضّل في المطعم، يُحضّر بالطريقة الإسبانية التقليدية.",
    "deliver_to": "اطلب مباشرة إلى طاولتك",
    "add_to_favorites": "أضف إلى المفضلة",
    "heat_label": "حار",
    "fav_label": "مفضّل",
    "add_x_to_cart": "أضف {name} إلى السلة",
    "remove_x": "إزالة {name}",
    "qty_label": "الكمية",
    "feedback_title": "شاركنا رأيك",
    "feedback_sub": "كيف كانت تجربتك معنا؟",
    "feedback_placeholder": "أخبرنا برأيك...",
    "feedback_submit": "إرسال الرأي",
    "feedback_thanks": "شكراً لرأيك!",
    "feedback_need_rating": "يرجى اختيار تقييم أولاً."
  }
};

/* ============================================================
   Models
   ============================================================ */
const localizedString = { en: String, ku: String, ar: String };
const localizedList = { en: [String], ku: [String], ar: [String] };

const MenuItem = mongoose.model("MenuItem", new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  quickTag: String,
  name: localizedString,
  price: Number,
  cat: { type: String, enum: ["main", "starters", "desserts", "beverages"] },
  subcat: String,
  spicy: { type: Boolean, default: false },
  img: String,
  emoji: String,
  ingredients: localizedList,
  active: { type: Boolean, default: true }
}, { timestamps: true }));

const User = mongoose.model("User", new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["user", "admin"], default: "user" }
}, { timestamps: true }));
User.schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
User.schema.methods.matchPassword = function (pw) { return bcrypt.compare(pw, this.password); };

const Order = mongoose.model("Order", new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
    itemId: String, name: String, price: Number, qty: Number
  }],
  notes: String,
  table: { type: String, default: "Takeaway" },
  total: Number,
  status: { type: String, enum: ["pending", "preparing", "ready", "completed", "cancelled"], default: "pending" }
}, { timestamps: true }));

const Feedback = mongoose.model("Feedback", new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, min: 1, max: 5, required: true },
  text: String
}, { timestamps: true }));

const Favorite = mongoose.model("Favorite", new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true }
}, { timestamps: true }));
Favorite.schema.index({ user: 1, menuItem: 1 }, { unique: true });

/* ============================================================
   Helpers
   ============================================================ */
function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

async function protect(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.split(" ")[1] : null;
  if (!token) return res.status(401).json({ success: false, message: "Not authorized, no token." });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: "User no longer exists." });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(header.split(" ")[1], JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    } catch (e) { /* guest */ }
  }
  next();
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admins only." });
  next();
}

/* ============================================================
   App
   ============================================================ */
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== "*" ? process.env.CORS_ORIGIN.split(",") : "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ success: true, message: "TinyTrails API is running." }));

/* ---------- menu ---------- */
app.get("/api/menu", optionalAuth, asyncHandler(async (req, res) => {
  const { category, search, favoritesOnly } = req.query;
  const filter = { active: true };
  if (category && category !== "all") filter.cat = category;
  if (search) {
    const re = new RegExp(search, "i");
    filter.$or = [{ "name.en": re }, { "name.ku": re }, { "name.ar": re }, { subcat: re }];
  }
  if (favoritesOnly === "true") {
    if (!req.user) return res.status(401).json({ success: false, message: "Log in to filter by favorites." });
    const favs = await Favorite.find({ user: req.user._id }).select("menuItem");
    filter._id = { $in: favs.map((f) => f.menuItem) };
  }
  const items = await MenuItem.find(filter).sort({ cat: 1, subcat: 1, "name.en": 1 });
  res.json({ success: true, count: items.length, data: items });
}));

app.get("/api/menu/:id", asyncHandler(async (req, res) => {
  const item = await MenuItem.findOne({ id: req.params.id });
  if (!item) return res.status(404).json({ success: false, message: "Menu item not found." });
  res.json({ success: true, data: item });
}));

app.post("/api/menu", protect, adminOnly, asyncHandler(async (req, res) => {
  const exists = await MenuItem.findOne({ id: req.body.id });
  if (exists) return res.status(409).json({ success: false, message: "id already exists." });
  const item = await MenuItem.create(req.body);
  res.status(201).json({ success: true, data: item });
}));

app.put("/api/menu/:id", protect, adminOnly, asyncHandler(async (req, res) => {
  const item = await MenuItem.findOneAndUpdate({ id: req.params.id }, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ success: false, message: "Menu item not found." });
  res.json({ success: true, data: item });
}));

app.delete("/api/menu/:id", protect, adminOnly, asyncHandler(async (req, res) => {
  const item = await MenuItem.findOneAndDelete({ id: req.params.id });
  if (!item) return res.status(404).json({ success: false, message: "Menu item not found." });
  res.json({ success: true, data: {} });
}));

/* ---------- orders ---------- */
app.post("/api/orders", optionalAuth, asyncHandler(async (req, res) => {
  const { items, notes, table } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Order must include at least one item." });
  }
  const menuItems = await MenuItem.find({ id: { $in: items.map((i) => i.id) } });
  const byId = Object.fromEntries(menuItems.map((m) => [m.id, m]));
  const orderItems = items.map((line) => {
    const m = byId[line.id];
    if (!m) throw new Error("Unknown menu item id: " + line.id);
    const qty = Number(line.qty) > 0 ? Number(line.qty) : 1;
    return { menuItem: m._id, itemId: m.id, name: m.name.en, price: m.price, qty };
  });
  const total = orderItems.reduce((s, i) => s + i.price * i.qty, 0);
  const order = await Order.create({ user: req.user ? req.user._id : undefined, items: orderItems, notes: notes || "", table: table || "Takeaway", total });
  res.status(201).json({ success: true, data: order });
}));

app.get("/api/orders", asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: orders.length, data: orders });
}));

app.get("/api/orders/:id", protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found." });
  const isOwner = order.user && order.user.toString() === req.user._id.toString();
  if (req.user.role !== "admin" && !isOwner) return res.status(403).json({ success: false, message: "Not your order." });
  res.json({ success: true, data: order });
}));

app.put("/api/orders/:id/status", protect, adminOnly, asyncHandler(async (req, res) => {
  const allowed = ["pending", "preparing", "ready", "completed", "cancelled"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid status." });
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!order) return res.status(404).json({ success: false, message: "Order not found." });
  res.json({ success: true, data: order });
}));

app.delete("/api/orders/:id", protect, adminOnly, asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found." });
  res.json({ success: true, data: {} });
}));

/* ---------- feedback ---------- */
app.post("/api/feedback", optionalAuth, asyncHandler(async (req, res) => {
  const rating = Number(req.body.rating);
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: "rating must be 1-5." });
  const fb = await Feedback.create({ user: req.user ? req.user._id : undefined, rating, text: req.body.text || "" });
  res.status(201).json({ success: true, data: fb });
}));

app.get("/api/feedback", protect, adminOnly, asyncHandler(async (req, res) => {
  const fb = await Feedback.find().sort({ createdAt: -1 });
  res.json({ success: true, count: fb.length, data: fb });
}));

/* ---------- favorites ---------- */
app.get("/api/favorites", protect, asyncHandler(async (req, res) => {
  const favs = await Favorite.find({ user: req.user._id }).populate("menuItem");
  res.json({ success: true, count: favs.length, data: favs.map((f) => f.menuItem) });
}));

app.post("/api/favorites/:itemId", protect, asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findOne({ id: req.params.itemId });
  if (!menuItem) return res.status(404).json({ success: false, message: "Menu item not found." });
  const fav = await Favorite.findOneAndUpdate(
    { user: req.user._id, menuItem: menuItem._id },
    { user: req.user._id, menuItem: menuItem._id },
    { upsert: true, new: true }
  );
  res.status(201).json({ success: true, data: fav });
}));

app.delete("/api/favorites/:itemId", protect, asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findOne({ id: req.params.itemId });
  if (!menuItem) return res.status(404).json({ success: false, message: "Menu item not found." });
  await Favorite.findOneAndDelete({ user: req.user._id, menuItem: menuItem._id });
  res.json({ success: true, data: {} });
}));

/* ---------- translations ---------- */
app.get("/api/translations", (req, res) => {
  const lang = (req.query.lang || "en").toLowerCase();
  if (!TRANSLATIONS[lang]) {
    return res.status(400).json({ success: false, message: "Unsupported language \"" + lang + "\"." });
  }
  res.json({ success: true, lang, data: TRANSLATIONS[lang] });
});

/* ---------- auth ---------- */
app.post("/api/auth/register", asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: "name, email, password required." });
  if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be 6+ chars." });
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ success: false, message: "Email already registered." });
  const user = await User.create({ name, email, password });
  res.status(201).json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user) } });
}));

app.post("/api/auth/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password))) return res.status(401).json({ success: false, message: "Invalid email or password." });
  res.json({ success: true, data: { id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user) } });
}));

/* ---------- seed route (one-time use, dev convenience) ----------
   Visit /api/seed once in the browser (or call it) to load the 29
   TinyTrails dishes into MongoDB. Safe to call more than once — it
   clears menu items first each time. */
app.get("/api/seed", asyncHandler(async (req, res) => {
  await MenuItem.deleteMany();
  await MenuItem.insertMany(MENU_SEED);
  res.json({ success: true, message: "Seeded " + MENU_SEED.length + " menu items." });
}));

/* ---------- 404 + error handler ---------- */
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found - " + req.originalUrl }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || "Server error." });
});

/* ---------- start ---------- */
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected.");
    app.listen(PORT, () => console.log("TinyTrails API listening on port " + PORT));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
