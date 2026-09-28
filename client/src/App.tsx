import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Cog,
  Droplets,
  Factory,
  FileText,
  Globe2,
  Handshake,
  Landmark,
  Leaf,
  Mail,
  MapPin,
  Menu,
  MoveRight,
  Network,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  TrendingUp,
  BarChart3,
  Scale,
  Users,
  Wheat,
  X,
} from "lucide-react";

const HERO_IMAGE = "/heroImage.jpg";
const AGRICULTURE_IMAGE = "/about01.png";
const BACKR = "trans.png";

const PRODUCT_ROUTES = [
  "/food-agriculture",
  "/energy-petroleum",
  "/metals-raw-materials",
  "/building-construction",
  "/fertilizers-chemicals",
  "/consumer-industrial",
] as const;

const ABOUT_ROUTES = ["/about", "/our-approach", "/why-sancy-group"] as const;
const INSIGHTS_ROUTES = ["/insights", "/market-insights", "/trade-news"] as const;

const TRADE_NEWS_QUERY =
  '(trade OR shipping OR exports OR imports OR commodities OR freight OR "supply chain" OR tariffs)';
const TRADE_NEWS_API =
  "https://api.gdeltproject.org/api/v2/doc/doc?" +
  new URLSearchParams({
    query: TRADE_NEWS_QUERY,
    mode: "artlist",
    maxrecords: "12",
    timespan: "72h",
    sort: "DateDesc",
    format: "json",
  }).toString();

const TRADE_NEWS_CACHE_KEY = "sancy_trade_news_cache_v1";
const TRADE_NEWS_CACHE_TTL = 10 * 60 * 1000;
const TRADE_NEWS_FETCH_TIMEOUT = 3500;

type TradeNewsArticle = {
  url: string;
  title: string;
  seendate?: string;
  socialimage?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
};

// Three built-in articles guarantee that the Trade News page always has content,
// even if the live GDELT request is unavailable in the browser.
const STATIC_TRADE_NEWS: TradeNewsArticle[] = [
  { url: "https://www.reuters.com/world/middle-east/istanbul-stock-exchange-remove-over-quarter-main-index-regulators-tackle-liquidity-crisis-2026-09-22/", title: "Borsa Istanbul announces major BIST-100 reshuffle amid market liquidity measures", seendate: "20260922T104704", domain: "Reuters", sourcecountry: "Türkiye", socialimage: "https://cdn.sananews.sy/2026/04/Turkiye-ile-ABD-Arasindaki-Ticaret-Hacmi-Ilk-Ceyrekte-104-Milyar-Dolara-Ulasti-860x484.jpg" },
  { url: "https://www.anadoluajansi.gov.tr/en/economy/turkiye-us-trade-volume-hits-38b-as-economic-momentum-builds/4065693", title: "Türkiye–US trade volume reaches $38 billion as economic ties expand", seendate: "20260923T000000", domain: "Anadolu Agency", sourcecountry: "Türkiye", socialimage: "https://cdn.sananews.sy/2026/04/Turkiye-ile-ABD-Arasindaki-Ticaret-Hacmi-Ilk-Ceyrekte-104-Milyar-Dolara-Ulasti-860x484.jpg" },
  { url: "https://www.ticaret.gov.tr/haberler/ticaret-bakani-omer-bolat-agustos-ayi-dis-ticaret-verilerini-acikladi-03-09-2026", title: "Türkiye reports record August exports and stronger year-to-date trade", seendate: "20260903T000000", domain: "Ministry of Trade of Türkiye", sourcecountry: "Türkiye", socialimage: "https://cumha.com.tr/uploads/images/202602/image_870x_6998b353028d2.webp" },
  { url: "https://www.reuters.com/commentary/breakingviews/diesel-could-be-tipping-point-us-economy-2026-09-21/", title: "Higher diesel costs put pressure on US transport and the wider economy", seendate: "20260921T144219", domain: "Reuters", sourcecountry: "United States", socialimage: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=82" },
  { url: "https://www.reuters.com/business/finance/us-treasurys-bessent-chinas-he-meet-sunday-jpmorgan-headquarters-2026-09-19/", title: "US and China officials prepare talks on trade and broader economic issues", seendate: "20260919T183420", domain: "Reuters", sourcecountry: "United States", socialimage: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=82" },
  { url: "https://www.reuters.com/business/finance/china-keeps-benchmark-lending-rates-unchanged-16th-month-september-2026-09-20/", title: "China keeps benchmark lending rates unchanged for a 16th month", seendate: "20260920T010000", domain: "Reuters", sourcecountry: "China", socialimage: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=82" },
  { url: "https://www.reuters.com/world/asia-pacific/yuan-hits-fresh-multi-year-peak-pboc-eases-curb-ahead-trump-xi-summit-2026-09-21/", title: "Yuan reaches a multi-year high as China eases its currency guidance", seendate: "20260921T035114", domain: "Reuters", sourcecountry: "China", socialimage: "https://images.unsplash.com/photo-1548919973-5cef591cdbc9?auto=format&fit=crop&w=1200&q=82" },
  { url: "https://www.reuters.com/business/german-institutes-raise-2026-2027-economic-growth-forecasts-sources-say-2026-09-22/", title: "German institutes raise 2026 and 2027 economic growth forecasts", seendate: "20260922T082308", domain: "Reuters", sourcecountry: "Germany", socialimage: "https://images.unsplash.com/photo-1527866959252-deab85ef7d1b?auto=format&fit=crop&w=1200&q=82" },
  { url: "https://www.reuters.com/business/energy/europe-faces-q4-jet-fuel-supply-deficit-even-south-korea-becomes-latest-big-supplier-2026-09-21/", title: "South Korea becomes a major new supplier of jet fuel to Europe", seendate: "20260921T000426", domain: "Reuters", sourcecountry: "South Korea", socialimage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=82" },
];

type Language = "en" | "tr";

type Copy = {
  nav: Record<string, string>;
  hero: {
    kicker: string;
    title: string;
    body: string;
    primary: string;
    secondary: string;
    line: string;
    linee: string;
    lineee: string;
    subline: string;
    sublinee: string;
    global:string;
    globalDesc:string;
    international:string;
    internationall:string;
    trade:string;
    tradee:string;
    turkie:string;
    scroll:String;
    terms:String;
    copyright:String;
    next:string;
  };
  trust: string[];
  intro: { eyebrow: string; title: string; body: string[]; link: string };
  why: {
    eyebrow: string;
    title: string;
    body: string;
    items: { title: string; body: string }[];
  };
  about: {
    eyebrow: string;
    title: string;
    body: string[];
    quote: string;
    link: string;
    establishedinturkiye:string;
      structuredtradeapprouch:string;
      longtearm:string;
  };
  services: {
    eyebrow: string;
    title: string;
    body: string;
    items: { title: string; body: string; icon: string }[];
  };
  products: {
    eyebrow: string;
    title: string;
    body: string;
    categories: { title: string; items: string[]; accent: string }[];
  };
  markets: {
    eyebrow: string;
    title: string;
    body: string;
    buyer: { title: string; body: string; items: string[]; cta: string };
    supplier: { title: string; body: string; items: string[]; cta: string };
  };
  process: {
    eyebrow: string;
    title: string;
    body: string;
    steps: { no: string; title: string; body: string }[];
  };
  opportunities: {
    eyebrow: string;
    title: string;
    body: string;
    empty: string;
    primary: string;
    secondary: string;
  };
  insights: {
    eyebrow: string;
    title: string;
    body: string;
    empty: string;
    cta: string;
    marketTitle: string;
    marketBody: string;
    newsTitle: string;
    newsBody: string;
    explore: string;
  };
  marketInsights: {
    eyebrow: string;
    title: string;
    body: string;
    leadTitle: string;
    leadBody: string;
    signals: { title: string; body: string; icon: string }[];
    lensesTitle: string;
    sectors: { title: string; body: string }[];
    regionsTitle: string;
    regions: { title: string; body: string }[];
    cta: string;
  };
  tradeNews: {
    eyebrow: string;
    title: string;
    body: string;
    refresh: string;
    live: string;
    updated: string;
    source: string;
    open: string;
    loading: string;
    error: string;
    empty: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    body: string;
    formTitle: string;
    submit: string;
    note: string;
    fields: Record<string, string>;
  };
  footer: {
    descriptor: string;
    company: string;
    business: string;
    connect: string;
    legal: string;
  };
  shared: {
    explore: string;
    viewAll: string;
    learnMore: string;
    backHome: string;
    noData: string;
    availableOnRequest: string;
  };
};

const translations: Record<Language, Copy> = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      services: "Services",
      products: "Products",
      markets: "Markets",
      opportunities: "Trade opportunities",
      insights: "Insights",
      contact: "Contact",
      buyers: "Buyers",
      suppliers: "Suppliers",
      food: "Food & agriculture",
      approach: "Our approach",
      why: "Why Sancy Group",
      marketInsights: "Market insights",
      tradeNews: "Trade news",
      sourcing: "Global sourcing",
      import: "Import & export",
      logistics: "Logistics coordination",
      quotation: "Request a quotation",
    },
    hero: {
      kicker: "International trading house · Türkiye",
      title: "Global trade, built on trust.",
      body: "Connecting trusted suppliers with qualified buyers across international markets.",
      primary: "Explore our products",
      secondary: "Request a quotation",
      line: "Global trade.",
      linee: "Trusted connections.",
      lineee: "Reliable supply.",
      subline: "Next stop,",
      sublinee: "everywhere.",
      global:"Global connection",
      globalDesc:"From Türkiye to international markets, Sancy Group connects commercial requirements with sourcing opportunities through a structured B2B trading approach.",
      international:"International markets",
      internationall:"international",
    trade:"TRADE ROUTE / 2026",
    tradee:"Trade",
    turkie:"Türkiye",
      scroll:"Scroll to explore",
      terms:"Terms & Conditions",
      copyright:"© 2026 Sancy Group. All rights reserved.",
      next:"NEXT CONVERSATION",
    },
    trust: [
      "Global sourcing",
      "Sectors",
      "Import & export",
      "B2B trade",
      "Logistics coordination",
    ],
    intro: {
      eyebrow: "0 / The Sancy Group approach",
      title: "Your gateway to global trade.",
      body: [
        "Sancy Group brings together producers, suppliers and buyers through a professional international trading platform built around sourcing, commercial coordination and reliable supply.",
        "From product identification to shipment coordination, we help our partners navigate cross-border trade with clarity, efficiency and attention to commercial requirements.",
      ],
      link: "Discover our approach",
    },
    why: {
      eyebrow: "02 / Why Sancy Group",
      title: "The value is in the connection.",
      body: "A Türkiye-based advantage, shaped for the complexity of modern international trade.",
      items: [
        {
          title: "Global sourcing",
          body: "Access sourcing opportunities based on product specifications, volume, origin and destination requirements.",
        },
        {
          title: "Türkiye-based advantage",
          body: "A strategic base connecting Europe, the Middle East, Africa and Asia.",
        },
        {
          title: "B2B focus",
          body: "Structured around professional buyers, suppliers and international commercial transactions.",
        },
        {
          title: "Trade coordination",
          body: "From inquiry and sourcing to documentation and logistics coordination.",
        },
        {
          title: "Market connectivity",
          body: "Helping suppliers access new markets and buyers identify new sources of supply.",
        },
        {
          title: "Long-term partnerships",
          body: "Focused on dependable commercial relationships rather than one-off transactions.",
        },
      ],
    },
    about: {
      establishedinturkiye:"Established in Türkiye",
      structuredtradeapprouch:"Structured trade approach",
      longtearm:"Long-term partnerships",
      eyebrow: "03 / About Sancy Group",
      title:
        "Making international trade more accessible, structured and reliable.",
      body: [
        "Sancy Group is a Türkiye-based international trading company focused on connecting global supply with international demand.",
        "Since our establishment in 2023, Sancy Group has successfully built a solid reputation as a trusted partner in international trade and commercial brokerage.",
        "We connect global markets, facilitate seamless cross-border trade, and supply essential commodities through an extensive network of international partners and suppliers.",
        "Our core activities include food and agricultural products, global sourcing, import and export, B2B trade solutions and logistics coordination.",
      ],
      quote:
        "To make international trade more accessible, structured and reliable for our partners.",
      link: "More about Sancy Group",
    },
    services: {
      eyebrow: "04 / What we do",
      title: "Trade intelligence, made actionable.",
      body: "From first inquiry to final shipment, we align commercial requirements with the right supply opportunities.",
      items: [
        {
          title: "International trading",
          body: "Facilitating cross-border trade between qualified suppliers and buyers.",
          icon: "globe",
        },
        {
          title: "Global sourcing",
          body: "Finding suitable supply options according to product, quantity, origin and destination.",
          icon: "search",
        },
        {
          title: "Food & agriculture",
          body: "Trading and supplying selected food and agricultural commodities and finished food products.",
          icon: "wheat",
        },
        {
          title: "Energy & petroleum",
          body: "International sourcing and commercial coordination for selected energy and petroleum products.",
          icon: "droplets",
        },
        {
          title: "Building materials",
          body: "Sourcing and supplying selected construction and building materials.",
          icon: "building",
        },
        {
          title: "FMCG",
          body: "Supporting international sourcing and supply of selected fast-moving consumer goods.",
          icon: "package",
        },
        {
          title: "Metals & minerals",
          body: "Connecting buyers and suppliers across selected metals, minerals and raw materials.",
          icon: "factory",
        },
        {
          title: "Textiles & apparel",
          body: "Sourcing fabrics, yarns, garments and home textile products.",
          icon: "leaf",
        },
        {
          title: "Industrial machinery",
          body: "Supporting sourcing of production lines, machinery, generators and industrial spare parts.",
          icon: "cog",
        },
        {
          title: "Import & export coordination",
          body: "Supporting commercial transactions, documentation and shipment arrangements.",
          icon: "file",
        },
        {
          title: "Logistics coordination",
          body: "Working with logistics partners to coordinate sea, land and air transportation.",
          icon: "truck",
        },
        {
          title: "Market access",
          body: "Supporting suppliers seeking international buyers and buyers seeking alternative supply markets.",
          icon: "network",
        },
      ],
    },
    products: {
      eyebrow: "05 / Selected product verticals",
      title: "Supply, with a point of view.",
      body: "Product availability is subject to supplier verification, specifications, quantity and market requirements.",
      categories: [
        {
          title: "Food & agriculture",
          accent: "Core vertical",
          items: [
            "Edible oils",
            "Grains & pulses",
            "Sugar",
            "Canned & processed foods",
            "Frozen foods",
          ],
        },
        {
          title: "Energy & petroleum",
          accent: "Selected supply",
          items: ["Crude oil", "Diesel EN590", "LNG / LPG", "Petrochemicals"],
        },
        {
          title: "Metals & raw materials",
          accent: "Selected supply",
          items: ["Iron", "Steel", "Aluminum", "Copper", "Industrial minerals"],
        },
        {
          title: "Building & construction",
          accent: "Selected supply",
          items: [
            "Cement",
            "Clinker",
            "Marble",
            "Timber",
            "Structural building supplies",
          ],
        },
        {
          title: "Fertilizers & chemicals",
          accent: "Selected supply",
          items: ["Urea", "DAP", "NPK", "Industrial chemicals"],
        },
        {
          title: "Consumer & industrial",
          accent: "Selected supply",
          items: [
            "FMCG",
            "Textiles & apparel",
            "Industrial machinery & equipment",
          ],
        },
      ],
    },
    markets: {
      eyebrow: "06 / Markets",
      title: "Connecting markets. Creating opportunities.",
      body: "We connect commercial requirements with sourcing opportunities through a structured B2B trading approach.",
      buyer: {
        title: "For buyers",
        body: "Professional buyers seeking reliable international sourcing can work with us around a clear, specification-led brief.",
        items: [
          "Product sourcing",
          "Supplier identification",
          "Specifications & quantity",
          "Origin & destination",
          "Commercial coordination",
        ],
        cta: "Submit your requirement",
      },
      supplier: {
        title: "For suppliers",
        body: "Producers, manufacturers and suppliers can explore new market access with an experienced commercial partner.",
        items: [
          "Market access",
          "Buyer connections",
          "Product presentation",
          "Commercial coordination",
          "International sourcing opportunities",
        ],
        cta: "Become a supplier",
      },
    },
    process: {
      eyebrow: "07 / How we trade",
      title: "From sourcing to supply.",
      body: "A clear path from requirement to delivery, with commercial focus at every stage.",
      steps: [
        {
          no: "01",
          title: "Requirement",
          body: "Understanding product, quantity, specification, origin and destination.",
        },
        {
          no: "02",
          title: "Sourcing",
          body: "Identifying suitable suppliers and supply opportunities.",
        },
        {
          no: "03",
          title: "Commercial coordination",
          body: "Connecting qualified parties and aligning commercial requirements.",
        },
        {
          no: "04",
          title: "Documentation & logistics",
          body: "Supporting documentation and shipment coordination.",
        },
        {
          no: "05",
          title: "Delivery",
          body: "Supporting the transaction through the agreed supply process.",
        },
      ],
    },
    opportunities: {
      eyebrow: "08 / Trade opportunities",
      title: "Trade opportunities, when the fit is right.",
      body: "Opportunities may include sourcing requirements, supplier offers and selected international trade inquiries.",
      empty: "No current opportunities are available.",
      primary: "Submit your requirement",
      secondary: "Become a supplier",
    },
    insights: {
      eyebrow: "09 / Insights",
      title: "A clearer view of global trade.",
      body: "Sancy Group's insights platform brings together practical market context, trade intelligence and a live view of international developments.",
      empty: "Context first. Verification always. Action with purpose.",
      cta: "Talk to our team",
      marketTitle: "Market insights",
      marketBody: "Structured perspectives on supply, demand, logistics, commodities and the commercial signals that shape cross-border decisions.",
      newsTitle: "Trade news",
      newsBody: "A live global feed of trade, shipping, supply-chain and commodity coverage from international sources.",
      explore: "Explore",
    },
    marketInsights: {
      eyebrow: "09.0 / Market insights",
      title: "Read the market before the market moves.",
      body: "A practical framework for understanding the commercial conditions behind international sourcing and supply decisions.",
      leadTitle: "From information to commercial context.",
      leadBody: "Market conditions rarely move in one direction. We look at supply availability, buyer demand, freight conditions, commodity signals and regional access together so that a trade requirement can be understood in context.",
      signals: [
        { title: "Supply & availability", body: "Track origin, producer capacity, seasonality and specification fit before a sourcing opportunity is treated as actionable.", icon: "globe" },
        { title: "Freight & logistics", body: "Consider transit routes, port constraints, shipping conditions and delivery requirements alongside the product itself.", icon: "truck" },
        { title: "Commodity signals", body: "Use price direction, input costs and market sentiment as context rather than as a substitute for confirmed supplier quotations.", icon: "chart" },
        { title: "Buyer demand", body: "Read destination requirements, purchasing cycles, volumes and specifications to understand where demand may translate into a trade inquiry.", icon: "scale" },
      ],
      lensesTitle: "Commercial lenses",
      sectors: [
        { title: "Food & agriculture", body: "Seasonality, origin, specification, volume and shipment planning can materially shape sourcing decisions." },
        { title: "Energy & petroleum", body: "Commercial discussions depend on product specification, volume, origin, destination and delivery structure." },
        { title: "Metals & raw materials", body: "Grade, certification, quantity, origin and freight requirements are central to supplier and buyer alignment." },
        { title: "Building materials", body: "Project timing, technical specifications, container or bulk requirements and destination logistics influence supply planning." },
      ],
      regionsTitle: "Regional lens",
      regions: [
        { title: "Europe", body: "Established logistics networks and proximity can support structured sourcing from Türkiye into European destinations." },
        { title: "Middle East", body: "Fast-moving commercial requirements can make supplier responsiveness, documentation and delivery clarity especially important." },
        { title: "Africa", body: "Market access often depends on dependable sourcing, workable logistics and clear destination requirements." },
        { title: "Asia", body: "Longer routes and broader supplier networks make specifications, lead times and freight planning important parts of the brief." },
      ],
      cta: "Discuss a market requirement",
    },
    tradeNews: {
      eyebrow: "09.1 / Trade news",
      title: "World trade, updated.",
      body: "A live global feed covering trade, shipping, supply chains, commodities, imports, exports and related market developments.",
      refresh: "Refresh feed",
      live: "Live global feed",
      updated: "Updated",
      source: "Source",
      open: "Read article",
      loading: "Loading the latest trade news…",
      error: "The live feed could not be loaded right now.",
      empty: "No recent trade stories were returned.",
    },
    contact: {
      eyebrow: "10 / Start a conversation",
      title: "Let's build your next trade connection.",
      body: "Tell us what you are looking for and our team will help identify the right sourcing and supply opportunities.",
      formTitle: "Request a quotation",
      submit: "Send inquiry",
      note: "This demo form is ready for connection to a CRM, email service or backend workflow.",
      fields: {
        name: "Full name",
        company: "Company",
        email: "Email",
        phone: "Phone",
        country: "Country",
        product: "Product / commodity",
        quantity: "Quantity",
        destination: "Destination",
        message: "Message",
      },
    },
    footer: {
      descriptor: "International trading & sourcing",
      company: "Company",
      business: "Business",
      connect: "Connect",
      legal: "© 2026 Sancy Group. All rights reserved.",
    },
    shared: {
      explore: "Explore",
      viewAll: "View all",
      learnMore: "Learn more",
      backHome: "Back home",
      noData: "No content available yet",
      availableOnRequest: "Available on request",
    },
  },
  tr: {
    nav: {
      home: "Ana sayfa",
      about: "Hakkımızda",
      services: "Hizmetler",
      products: "Ürünler",
      markets: "Pazarlar",
      opportunities: "Ticaret fırsatları",
      insights: "İçgörüler",
      contact: "İletişim",
      buyers: "Alıcılar",
      suppliers: "Tedarikçiler",
      food: "Gıda & tarım",
      approach: "Yaklaşımımız",
      why: "Neden Sancy Group",
      marketInsights: "Pazar içgörüleri",
      tradeNews: "Ticaret haberleri",
      sourcing: "Küresel tedarik",
      import: "İthalat & ihracat",
      logistics: "Lojistik koordinasyonu",
      quotation: "Teklif isteyin",
    },
    hero: {
      kicker: "Uluslararası ticaret şirketi · Türkiye",
      title: "Güvene dayalı küresel ticaret.",
      body: "Güvenilir tedarikçileri uluslararası pazarlardaki nitelikli alıcılarla buluşturuyoruz.",
      primary: "Ürünlerimizi keşfedin",
      secondary: "Teklif isteyin",
      line: "Küresel ticaret.",
      linee: "Güvenilir bağlantılar.",
      lineee: "Sürekli tedarik.",
      subline: "Sıradaki durak, her yer.",
      sublinee: "her yer.",
      global:"Global bağlantı",
      globalDesc: "Türkiye'den uluslararası pazarlara uzanan Sancy Group, ticari gereksinimleri yapılandırılmış bir B2B ticaret yaklaşımıyla tedarik fırsatlarıyla buluşturur.",
      international: "Uluslararası pazarlar",
      internationall: "Uluslararası",
      terms: "Şartlar ve Koşullar",
      copyright: "© 2026 Sancy Group. Tüm hakları saklıdır.",
      next: "SONRAKİ GÖRÜŞME",


trade: "TİCARET ROTASI / 2026",
tradee: "Ticaret",

turkie: "Türkiye",
      scroll: "Kaydırarak keşfedin"
    },
    trust: [
      "Küresel tedarik",
      "Sektörler",
      "İthalat & ihracat",
      "B2B ticaret",
      "Lojistik koordinasyonu",
    ],
    intro: {
      eyebrow: "01 / Sancy Group yaklaşımı",
      title: "Küresel ticarete açılan kapınız.",
      body: [
        "Sancy Group; üreticileri, tedarikçileri ve alıcıları tedarik, ticari koordinasyon ve güvenilir arz üzerine kurulu profesyonel bir uluslararası ticaret platformunda buluşturur.",
        "Ürün belirlemeden sevkiyat koordinasyonuna kadar, iş ortaklarımızın sınır ötesi ticareti netlik, verimlilik ve ticari gerekliliklere odaklanarak yönetmesine yardımcı oluyoruz.",
      ],
      link: "Yaklaşımımızı keşfedin",
    },
    why: {
      eyebrow: "02 / Neden Sancy Group",
      title: "Değer, bağlantıda saklıdır.",
      body: "Modern uluslararası ticaretin karmaşıklığı için şekillenen Türkiye merkezli avantaj.",
      items: [
        {
          title: "Küresel tedarik",
          body: "Ürün özellikleri, hacim, menşe ve varış gerekliliklerine göre tedarik fırsatlarına erişim.",
        },
        {
          title: "Türkiye merkezli avantaj",
          body: "Avrupa, Orta Doğu, Afrika ve Asya'yı birbirine bağlayan stratejik bir merkez.",
        },
        {
          title: "B2B odağı",
          body: "Profesyonel alıcılar, tedarikçiler ve uluslararası ticari işlemler etrafında yapılandırılmış yaklaşım.",
        },
        {
          title: "Ticari koordinasyon",
          body: "Talep ve tedarikten dokümantasyon ve lojistik koordinasyonuna kadar destek.",
        },
        {
          title: "Pazar bağlantısı",
          body: "Tedarikçilerin yeni pazarlara erişmesine, alıcıların yeni kaynaklar bulmasına yardımcı oluruz.",
        },
        {
          title: "Uzun vadeli ortaklıklar",
          body: "Tek seferlik işlemlerden çok güvenilir ticari ilişkilere odaklanıyoruz.",
        },
      ],
    },
    about: {
      establishedinturkiye: "Türkiye'de kurulu",
structuredtradeapprouch: "Yapılandırılmış ticaret yaklaşımı",
longtearm: "Uzun vadeli ortaklıklar",
      eyebrow: "03 / Sancy Group hakkında",
      title:
        "Uluslararası ticareti daha erişilebilir, yapılı ve güvenilir hale getiriyoruz.",
      body: [
        "Sancy Group, küresel arzı uluslararası taleple buluşturmaya odaklanan Türkiye merkezli bir uluslararası ticaret şirketidir.",
        "2023 yılında kuruluşumuzdan bu yana Sancy Group, uluslararası ticaret ve ticari aracılık alanında güvenilir bir iş ortağı olarak sağlam bir itibar oluşturmuştur.",
        "Küresel pazarları birbirine bağlıyor, sınır ötesi ticareti kolaylaştırıyor ve uluslararası ortak ve tedarikçilerden oluşan ağımızla temel ürünlerin tedarikini sağlıyoruz.",
        "Temel faaliyetlerimiz arasında gıda ve tarım ürünleri, küresel tedarik, ithalat ve ihracat, B2B ticaret çözümleri ve lojistik koordinasyonu yer alır.",
      ],
      quote:
        "İş ortaklarımız için uluslararası ticareti daha erişilebilir, yapılı ve güvenilir hale getirmek.",
      link: "Sancy Group hakkında",
    },
    services: {
      eyebrow: "04 / Ne yapıyoruz",
      title: "Ticaret zekâsı, aksiyona dönüşür.",
      body: "İlk talepten son sevkiyata kadar ticari gereklilikleri doğru tedarik fırsatlarıyla eşleştiriyoruz.",
      items: [
        {
          title: "Uluslararası ticaret",
          body: "Nitelikli tedarikçiler ve alıcılar arasında sınır ötesi ticareti kolaylaştırıyoruz.",
          icon: "globe",
        },
        {
          title: "Küresel tedarik",
          body: "Ürün, miktar, menşe ve varışa göre uygun tedarik seçenekleri buluyoruz.",
          icon: "search",
        },
        {
          title: "Gıda & tarım",
          body: "Seçili gıda ve tarım ürünleri ile işlenmiş gıda ürünlerinde tedarik ve ticaret.",
          icon: "wheat",
        },
        {
          title: "Enerji & petrol",
          body: "Seçili enerji ve petrol ürünlerinde uluslararası tedarik ve ticari koordinasyon.",
          icon: "droplets",
        },
        {
          title: "Yapı malzemeleri",
          body: "Seçili inşaat ve yapı malzemelerinde tedarik ve satış desteği.",
          icon: "building",
        },
        {
          title: "Hızlı tüketim",
          body: "Seçili hızlı tüketim ürünlerinde uluslararası tedarik ve arz desteği.",
          icon: "package",
        },
        {
          title: "Metaller & mineraller",
          body: "Seçili metal, mineral ve hammaddelerde alıcı ve tedarikçi bağlantısı.",
          icon: "factory",
        },
        {
          title: "Tekstil & hazır giyim",
          body: "Kumaş, iplik, hazır giyim ve ev tekstili ürünlerinde tedarik.",
          icon: "leaf",
        },
        {
          title: "Endüstriyel makine",
          body: "Üretim hatları, makineler, jeneratörler ve yedek parça tedarikine destek.",
          icon: "cog",
        },
        {
          title: "İthalat & ihracat koordinasyonu",
          body: "Ticari işlemler, dokümantasyon ve sevkiyat düzenlemelerine destek.",
          icon: "file",
        },
        {
          title: "Lojistik koordinasyonu",
          body: "Deniz, kara ve hava taşımacılığını lojistik ortaklarıyla koordine ediyoruz.",
          icon: "truck",
        },
        {
          title: "Pazar erişimi",
          body: "Uluslararası alıcı arayan tedarikçilere ve alternatif kaynak arayan alıcılara destek.",
          icon: "network",
        },
      ],
    },
    products: {
      eyebrow: "05 / Seçili ürün dikeyleri",
      title: "Odaklı bir tedarik yaklaşımı.",
      body: "Ürün bulunabilirliği; tedarikçi doğrulaması, teknik özellikler, miktar ve pazar gerekliliklerine bağlıdır.",
      categories: [
        {
          title: "Gıda & tarım",
          accent: "Ana dikey",
          items: [
            "Yemeklik yağlar",
            "Tahıllar & bakliyat",
            "Şeker",
            "Konserve & işlenmiş gıdalar",
            "Dondurulmuş gıdalar",
          ],
        },
        {
          title: "Enerji & petrol",
          accent: "Seçili tedarik",
          items: ["Ham petrol", "Dizel EN590", "LNG / LPG", "Petrokimyasallar"],
        },
        {
          title: "Metaller & hammaddeler",
          accent: "Seçili tedarik",
          items: [
            "Demir",
            "Çelik",
            "Alüminyum",
            "Bakır",
            "Endüstriyel mineraller",
          ],
        },
        {
          title: "Yapı & inşaat",
          accent: "Seçili tedarik",
          items: [
            "Çimento",
            "Klinker",
            "Mermer",
            "Kereste",
            "Yapısal yapı ürünleri",
          ],
        },
        {
          title: "Gübre & kimyasallar",
          accent: "Seçili tedarik",
          items: ["Üre", "DAP", "NPK", "Endüstriyel kimyasallar"],
        },
        {
          title: "Tüketici & endüstriyel",
          accent: "Seçili tedarik",
          items: [
            "Hızlı tüketim",
            "Tekstil & hazır giyim",
            "Endüstriyel makine & ekipman",
          ],
        },
      ],
    },
    markets: {
      eyebrow: "06 / Pazarlar",
      title: "Pazarları bağlıyor, fırsatlar yaratıyoruz.",
      body: "Ticari gereklilikleri yapılandırılmış B2B yaklaşımıyla tedarik fırsatlarıyla buluşturuyoruz.",
      buyer: {
        title: "Alıcılar için",
        body: "Güvenilir uluslararası tedarik arayan profesyonel alıcılar, net ve teknik özellik odaklı bir taleple bizimle çalışabilir.",
        items: [
          "Ürün tedariki",
          "Tedarikçi belirleme",
          "Özellikler & miktar",
          "Menşe & varış",
          "Ticari koordinasyon",
        ],
        cta: "Talebinizi iletin",
      },
      supplier: {
        title: "Tedarikçiler için",
        body: "Üreticiler, imalatçılar ve tedarikçiler deneyimli bir ticari ortakla yeni pazar erişimlerini değerlendirebilir.",
        items: [
          "Pazar erişimi",
          "Alıcı bağlantıları",
          "Ürün sunumu",
          "Ticari koordinasyon",
          "Uluslararası tedarik fırsatları",
        ],
        cta: "Tedarikçi olun",
      },
    },
    process: {
      eyebrow: "07 / Nasıl ticaret yapıyoruz",
      title: "Tedarikten arzın son adımına.",
      body: "Gereksinimden teslimata kadar her aşamada ticari odağı koruyan net bir yol.",
      steps: [
        {
          no: "01",
          title: "Gereksinim",
          body: "Ürün, miktar, teknik özellik, menşe ve varışın anlaşılması.",
        },
        {
          no: "02",
          title: "Tedarik",
          body: "Uygun tedarikçilerin ve tedarik fırsatlarının belirlenmesi.",
        },
        {
          no: "03",
          title: "Ticari koordinasyon",
          body: "Nitelikli tarafların buluşturulması ve ticari gerekliliklerin eşleştirilmesi.",
        },
        {
          no: "04",
          title: "Dokümantasyon & lojistik",
          body: "Belgelendirme ve sevkiyat koordinasyonuna destek.",
        },
        {
          no: "05",
          title: "Teslimat",
          body: "Mutabık kalınan tedarik süreci boyunca işlemin desteklenmesi.",
        },
      ],
    },
    opportunities: {
      eyebrow: "08 / Ticaret fırsatları",
      title: "Doğru eşleşme için ticaret fırsatları.",
      body: "Fırsatlar; tedarik taleplerini, tedarikçi tekliflerini ve seçili uluslararası ticaret sorgularını içerebilir.",
      empty: "Şu anda mevcut bir fırsat bulunmuyor.",
      primary: "Talebinizi iletin",
      secondary: "Tedarikçi olun",
    },
    insights: {
      eyebrow: "09 / İçgörüler",
      title: "Küresel ticarete daha net bir bakış.",
      body: "Sancy Group içgörü platformu; pratik pazar bağlamını, ticaret istihbaratını ve uluslararası gelişmelerin canlı görünümünü bir araya getirir.",
      empty: "Önce bağlam. Her zaman doğrulama. Amaca yönelik aksiyon.",
      cta: "Ekibimizle konuşun",
      marketTitle: "Pazar içgörüleri",
      marketBody: "Tedarik, talep, lojistik, emtia ve sınır ötesi kararları şekillendiren ticari sinyallere ilişkin yapılandırılmış değerlendirmeler.",
      newsTitle: "Ticaret haberleri",
      newsBody: "Uluslararası kaynaklardan ticaret, deniz taşımacılığı, tedarik zinciri ve emtia gelişmelerini izleyen canlı akış.",
      explore: "Keşfedin",
    },
    marketInsights: {
      eyebrow: "09.0 / Pazar içgörüleri",
      title: "Pazar hareketlenmeden önce pazarı okuyun.",
      body: "Uluslararası tedarik ve arz kararlarının arkasındaki ticari koşulları anlamak için pratik bir çerçeve.",
      leadTitle: "Bilgiden ticari bağlama.",
      leadBody: "Pazar koşulları nadiren tek yönde hareket eder. Bir ticaret talebini doğru bağlamda değerlendirmek için tedarik durumu, alıcı talebi, navlun koşulları, emtia sinyalleri ve bölgesel erişimi birlikte ele alıyoruz.",
      signals: [
        { title: "Tedarik & bulunabilirlik", body: "Bir tedarik fırsatını uygulanabilir kabul etmeden önce menşe, üretici kapasitesi, sezonluk etkiler ve teknik uygunluğu değerlendiririz.", icon: "globe" },
        { title: "Navlun & lojistik", body: "Ürünün yanında güzergâhlar, liman koşulları, taşımacılık şartları ve teslim gerekliliklerini dikkate alırız.", icon: "truck" },
        { title: "Emtia sinyalleri", body: "Fiyat yönünü, girdi maliyetlerini ve piyasa beklentilerini bağlam olarak kullanır; bunları kesin tedarikçi teklifinin yerine koymayız.", icon: "chart" },
        { title: "Alıcı talebi", body: "Varış pazarı gereklilikleri, satın alma döngüleri, hacim ve spesifikasyonları inceleyerek talebin ticari sorguya dönüşebileceği alanları anlamaya çalışırız.", icon: "scale" },
      ],
      lensesTitle: "Ticari mercekler",
      sectors: [
        { title: "Gıda & tarım", body: "Sezonluk yapı, menşe, spesifikasyon, hacim ve sevkiyat planlaması tedarik kararlarını doğrudan etkileyebilir." },
        { title: "Enerji & petrol", body: "Ticari görüşmeler ürün spesifikasyonu, hacim, menşe, varış ve teslimat yapısına bağlıdır." },
        { title: "Metaller & hammaddeler", body: "Kalite, sertifika, miktar, menşe ve navlun gereklilikleri alıcı ve tedarikçi uyumunda belirleyicidir." },
        { title: "Yapı malzemeleri", body: "Proje takvimi, teknik özellikler, konteyner veya dökme taşımacılık ve varış lojistiği tedarik planını etkiler." },
      ],
      regionsTitle: "Bölgesel mercek",
      regions: [
        { title: "Avrupa", body: "Yerleşik lojistik ağları ve coğrafi yakınlık, Türkiye'den Avrupa destinasyonlarına yapılandırılmış tedariki destekleyebilir." },
        { title: "Orta Doğu", body: "Hızlı ticari gereksinimler, tedarikçi yanıt hızı, dokümantasyon ve teslimat netliğini özellikle önemli hale getirebilir." },
        { title: "Afrika", body: "Pazar erişimi çoğu zaman güvenilir tedarik, uygulanabilir lojistik ve net varış gerekliliklerine bağlıdır." },
        { title: "Asya", body: "Daha uzun rotalar ve daha geniş tedarik ağları, spesifikasyonları, terminleri ve navlun planlamasını önemli hale getirir." },
      ],
      cta: "Bir pazar gereksinimini görüşün",
    },
    tradeNews: {
      eyebrow: "09.1 / Ticaret haberleri",
      title: "Dünya ticareti, güncel.",
      body: "Ticaret, deniz taşımacılığı, tedarik zincirleri, emtia, ithalat, ihracat ve ilgili küresel gelişmeleri kapsayan canlı haber akışı.",
      refresh: "Akışı yenile",
      live: "Canlı küresel akış",
      updated: "Güncellendi",
      source: "Kaynak",
      open: "Haberi aç",
      loading: "En güncel ticaret haberleri yükleniyor…",
      error: "Canlı haber akışı şu anda yüklenemiyor.",
      empty: "Yakın zamanda yayınlanmış ticaret haberi bulunamadı.",
    },
    contact: {
      eyebrow: "10 / İletişim başlatın",
      title: "Bir sonraki ticaret bağlantınızı birlikte kuralım.",
      body: "Aradığınız ürünü veya fırsatı anlatın; ekibimiz doğru tedarik ve arz seçeneklerini belirlemenize yardımcı olsun.",
      formTitle: "Teklif isteyin",
      submit: "Talebi gönder",
      note: "Bu demo formu CRM, e-posta servisi veya backend akışına bağlanmaya hazırdır.",
      fields: {
        name: "Ad soyad",
        company: "Şirket",
        email: "E-posta",
        phone: "Telefon",
        country: "Ülke",
        product: "Ürün / emtia",
        quantity: "Miktar",
        destination: "Varış yeri",
        message: "Mesaj",
      },
    },
    footer: {
      descriptor: "Uluslararası ticaret & tedarik",
      company: "Şirket",
      business: "İş",
      connect: "Bağlantı",
      legal: "© 2026 Sancy Group. Tüm hakları saklıdır.",
    },
    shared: {
      explore: "Keşfet",
      viewAll: "Tümünü gör",
      learnMore: "Daha fazla bilgi",
      backHome: "Ana sayfaya dön",
      noData: "Henüz içerik bulunmuyor",
      availableOnRequest: "Talep üzerine",
    },
  },
};

const iconMap: Record<string, React.ElementType> = {
  globe: Globe2,
  search: Search,
  wheat: Wheat,
  droplets: Droplets,
  building: Building2,
  package: Package,
  factory: Factory,
  leaf: Leaf,
  cog: Cog,
  file: FileText,
  truck: Truck,
  network: Network,
};

function SectionReveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = document.getElementById("sancy-reveal-root");
    const elements = node?.querySelectorAll("[data-reveal]");
    if (!elements) return;
    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(
          entry =>
            entry.isIntersecting && entry.target.classList.add("is-visible")
        ),
      { threshold: 0.08 }
    );
    elements.forEach(element => observer.observe(element));
    setVisible(true);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={`${visible ? "reveal-ready" : ""} ${className}`}>
      {children}
    </div>
  );
}

function Logo({ light = false }) {
  return (
    <div className={`logo-lockup ${light ? "text-white" : "text-ink"}`}>
      <img src="/sancygruoplogo.png" alt="Sancy Group" className="sancy-logo" />
    </div>
  );
}

function ButtonLink({
  children,
  onClick,
  variant = "dark",
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "dark" | "gold" | "outline" | "light";
  href?: string;
}) {
  const className = `btn btn-${variant}`;
  return href ? (
    <a className={className} href={href} onClick={onClick}>
      {children}
      <ArrowUpRight size={16} />
    </a>
  ) : (
    <button className={className} onClick={onClick}>
      {children}
      <ArrowUpRight size={16} />
    </button>
  );
}

function Header({
  copy,
  lang,
  setLang,
  navigate,
}: {
  copy: Copy;
  lang: Language;
  setLang: (lang: Language) => void;
  navigate: (path: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const groups = useMemo(
    () => ({
      about: [copy.nav.about, copy.nav.approach, copy.nav.why],
      products: [
        copy.nav.food,
        "Energy & petroleum",
        "Metals & raw materials",
        "Building & construction",
        "Fertilizers & chemicals",
      ],
      markets: [copy.nav.markets, copy.nav.buyers, copy.nav.suppliers],
      opportunities: [
        copy.nav.opportunities,
        "How we trade",
        copy.nav.quotation,
      ],
      insights: [copy.nav.insights, copy.nav.marketInsights, copy.nav.tradeNews],
    }),
    [copy]
  );
  const go = (path: string) => {
    setOpen(null);
    setMobile(false);
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  // Scroll effect in mobile
  const [hideNav, setHideNav] = useState(false);
const [scrolled, setScrolled] = useState(false);
useEffect(() => {
  let lastScrollY = window.scrollY;

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    // Glass effect
    setScrolled(currentScrollY > 20);

    // Mobile only
    if (window.innerWidth <= 768) {
      // نزول
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setHideNav(true);
      }

      // صعود
      if (currentScrollY < lastScrollY) {
        setHideNav(false);
      }

      // أعلى الصفحة
      if (currentScrollY <= 20) {
        setHideNav(false);
      }
    } else {
      setHideNav(false);
    }

    lastScrollY = currentScrollY;
  };

  window.addEventListener("scroll", handleScroll, { passive: true });

  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}, []);

//  

  useEffect(() => {
    const onKey = (event: KeyboardEvent) =>
      event.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      <header className={`site-header ${
    scrolled ? "scrolled" : ""
  } ${hideNav ? "nav-hidden" : ""}`}
  >
        <div className="nav-shell">
          <button
            className="logo-button"
            onClick={() => go("/")}
            aria-label="Sancy Group home"
          >
            <Logo />
          </button>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <button onClick={() => go("/")}>{copy.nav.home}</button>
            {(
              [
                "about",
                "services",
                "products",
                "markets",
                "opportunities",
                "insights",
              ] as const
            ).map(item => (
              <div className={`nav-dropdown nav-${item}`} key={item}>
                <button
                  className={open === item ? "active" : ""}
                  onClick={event => {
                    if (item === "services") {
                      go("/services");
                      return;
                    }

                    if (open === item) {
                      setOpen(null);
                      return;
                    }

                    setOpen(item);
                  }}
                >
                  {copy.nav[item]}
                  {item !== "services" && <ChevronDown size={13} />}
                </button>
                {open === item && item !== "services" && (
                  <div
                    className={`mega-menu ${item === "products" ? "mega-products" : ""}`}
                  >
                    <div className="mega-intro">
                      <span>
                        0
                        {[
                          "about",
                          "products",
                          "markets",
                          "opportunities",
                          "insights",
                        ].indexOf(item) + 1}{" "}
                        /
                      </span>
                      <strong>{copy.nav[item]}</strong>
                      <p>
                        {item === "products"
                          ? copy.products.body
                          : item === "markets"
                            ? copy.markets.body
                            : item === "about"
                              ? copy.about.body[0]
                              : item === "opportunities"
                                ? copy.opportunities.body
                                : copy.insights.body}
                      </p>
                    </div>
                    <div className="mega-links">
                      {groups[item].map((label, index) => (
                        <button
                          key={label}
                          onClick={() =>
                            go(
                              item === "about"
                                ? ABOUT_ROUTES[index] || "/about"
                                : item === "products"
                                  ? PRODUCT_ROUTES[index] || "/products"
                                  : item === "markets"
                                    ? index === 1
                                      ? "/buyers"
                                      : index === 2
                                        ? "/suppliers"
                                        : "/markets"
                                    : item === "opportunities"
                                      ? "/trade-opportunities"
                                      : INSIGHTS_ROUTES[index] || "/insights"
                            )
                          }
                        >
                          <span>{label}</span>
                          <ArrowUpRight size={15} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button onClick={() => go("/contact")}>{copy.nav.contact}</button>
          </nav>
          <div className="nav-actions">
            <div className="language-switcher">
              <button
                className={lang === "en" ? "selected" : ""}
                onClick={() => setLang("en")}
              >
                EN
              </button>
              <span>/</span>
              <button
                className={lang === "tr" ? "selected" : ""}
                onClick={() => setLang("tr")}
              >
                TR
              </button>
            </div>
            <button
              className="mobile-trigger"
              onClick={() => setMobile(!mobile)}
              aria-label={mobile ? "Close menu" : "Open menu"}
            >
              {mobile ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>
      {mobile && (
        <div className="mobile-menu"
        // className= {`mobile-menu ${hideNav ? "nav-hidden" : ""}`}
        >
          <div className="mobile-menu-inner">
            <button onClick={() => go("/")}>{copy.nav.home}</button>
            {(
              [
                "about",
                "services",
                "products",
                "markets",
                "opportunities",
                "insights",
              ] as const
            ).map(item => (
              <div key={item} className="mobile-group">
                <button
                  className="mobile-group-trigger"
                  onClick={() =>
                    item === "services"
                      ? go("/services")
                      : setMobileGroup(mobileGroup === item ? null : item)
                  }
                >
                  {copy.nav[item]}
                  {item !== "services" && (
                    <Plus
                      size={17}
                      className={mobileGroup === item ? "rotate-45" : ""}
                    />
                  )}
                </button>
                {mobileGroup === item && item !== "services" && (
                  <div className="mobile-subnav">
                    {groups[item].map((label, index) => (
                      <button
                        key={label}
                        onClick={() =>
                          go(
                            item === "about"
                              ? ABOUT_ROUTES[index] || "/about"
                              : item === "products"
                                ? PRODUCT_ROUTES[index] || "/products"
                                : item === "markets"
                                  ? index === 1
                                    ? "/buyers"
                                    : index === 2
                                      ? "/suppliers"
                                      : "/markets"
                                  : item === "opportunities"
                                    ? "/trade-opportunities"
                                    : INSIGHTS_ROUTES[index] || "/insights"
                          )
                        }
                      >
                        {label}
                        <ChevronRight size={14} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button onClick={() => go("/contact")}>{copy.nav.contact}</button>
            <div className="mobile-language">
              <button
                className={lang === "en" ? "selected" : ""}
                onClick={() => setLang("en")}
              >
                EN
              </button>
              <span>/</span>
              <button
                className={lang === "tr" ? "selected" : ""}
                onClick={() => setLang("tr")}
              >
                TR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
  light = false,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  light?: boolean;
  align?: "left" | "center";
}) {
  return (
    <div
      className={`section-heading ${light ? "light" : ""} ${align === "center" ? "center" : ""}`}
      data-reveal
    >
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  );
}

function Home({
  copy,
  lang,
  navigate,
}: {
  copy: Copy;
  lang: Language;
  navigate: (path: string) => void;
}) {
  return (
    <div id="sancy-reveal-root">
      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(6,17,29,.94) 0%, rgba(6,17,29,.76) 45%, rgba(6,17,29,.25) 100%), url(${HERO_IMAGE})`,
        }}
      >
        <div className="hero-grid" />
        <div className="hero-layout">

  {/* LEFT SIDE */}
  <div className="hero-content" data-reveal>
    <span className="hero-kicker">
      <span className="pulse-dot" />
      {copy.hero.kicker}
    </span>

    <h1>{copy.hero.title}</h1>

    <p>{copy.hero.body}</p>

    <div className="hero-actions">
      <ButtonLink variant="gold" href="#products">
        {copy.hero.primary}
      </ButtonLink>

      <ButtonLink variant="outline" href="#contact">
        {copy.hero.secondary}
      </ButtonLink>
    </div>
  </div>


  {/* RIGHT SIDE CARD */}
  <div className="hero-card-wrapper">
    <div className="hero-card">

      <div className="hero-card-line"></div>

      <div className="hero-card-text">
      
        <p>{copy.hero.line}</p>
        <p>{copy.hero.linee}</p>
        <p>{copy.hero.lineee}</p>
      </div>

      <p className="hero-card-subline">
        {copy.hero.subline} {copy.hero.sublinee}
      </p>

    </div>
  </div>

</div>


        
        {/* <div className="hero-content" data-reveal>
          <span className="hero-kicker">
            <span className="pulse-dot" />
            {copy.hero.kicker}
          </span>
          <h1>{copy.hero.title}</h1>
          <p>{copy.hero.body}</p>
          <div className="hero-actions">
            <ButtonLink variant="gold" href="#products">
              {copy.hero.primary}
            </ButtonLink>
            <ButtonLink variant="outline" href="#contact">
              {copy.hero.secondary}
            </ButtonLink>
          </div>



<div className="hero-card">
  <div className="hero-card-line"></div>

  <div className="hero-card-text">
    <p>Global trade.</p>
    <p>Trusted connections.</p>
    <p>Reliable supply.</p>
  </div>

  <p className="hero-card-subline">
    Next stop, everywhere.
  </p>
</div>

          
        
          <div className="hero-signature hero-card">
            <span>{copy.hero.line}</span>
            <strong>{copy.hero.subline}</strong>
          </div>
        </div> */}
        <div className="hero-coordinate">
          {/* 38° 25′ N&nbsp;&nbsp; 27° 08′ E <span>01 / 10</span> */}
        </div>
        <a className="hero-scroll" href="#intro">
          <span> {copy.hero.scroll} </span>
          <span className="scroll-line" />
        </a>
      </section>
      <div className="trust-strip">
        {copy.trust.map((item, index) => (
          <div key={item}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            {item}
            {index < copy.trust.length - 1 && <CircleDot size={8} />}
          </div>
        ))}
      </div>
      <main>
        <section id="intro" className="intro-section section-pad">
          <div className="intro-layout">
            <SectionHeading
              eyebrow={copy.intro.eyebrow}
              title={copy.intro.title}
              body={copy.intro.body[0]}
            />
            <div className="intro-copy" data-reveal>
              <p>{copy.intro.body[1]}</p>
              <a className="text-link" href="#about">
                {copy.intro.link}
                <MoveRight size={17} />
              </a>
            </div>
          </div>
          <div className="intro-image-wrap" data-reveal>
            <img
              src={AGRICULTURE_IMAGE}
              alt="Golden agricultural field with cargo vessel in the distance"
            />
            {/* <div className="image-caption">
              <span>Trade / 01</span>
              <strong>From origin to opportunity.</strong>
            </div> */}
            <div className="corner-mark" />
          </div>
        </section>
        <section id="why" className="why-section section-pad dark-section">
          <div className="container">
            <SectionHeading
              eyebrow={copy.why.eyebrow}
              title={copy.why.title}
              body={copy.why.body}
              light
            />
            <div className="why-grid">
              {copy.why.items.map((item, index) => (
                <article
                  className="why-card"
                  key={item.title}
                  data-reveal
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <span className="card-number">0{index + 1}</span>
                  <ShieldCheck size={23} strokeWidth={1.25} />
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="about" className="about-section section-pad">
  <div className="container about-layout">

    <div className="about-aside" data-reveal>

      <span className="large-index">03</span>

      <div className="about-image">
  <picture>
    <source
      media="(max-width: 780px)"
      srcSet="/about.png"
    />

    <img
      src="/about03.png"
      alt="Sancy Group"
    />
  </picture>
</div>

      <div className="about-stamp">
        <Globe2 size={22} />

        <span>
          {copy.hero.turkie}
          <br />
          {copy.hero.internationall}
          <br />
          {copy.hero.tradee}
        </span>
      </div>

    </div>

    <div>
      <div className="about-section-heading">
  <SectionHeading
    eyebrow={copy.about.eyebrow}
    title={copy.about.title}
  />
</div>

      <div className="about-body">
        {copy.about.body.map(paragraph => (
          <p key={paragraph} data-reveal>
            {paragraph}
          </p>
        ))}
      </div>

      <blockquote data-reveal>
        <span>“</span>
        {copy.about.quote}
      </blockquote>

      <a className="text-link" href="#contact">
        {copy.about.link}
        <MoveRight size={17} />
      </a>
    </div>

  </div>
</section>
        <section
          id="services"
          className="services-section section-pad soft-section"
        >
          <div className="container">
            <SectionHeading
              eyebrow={copy.services.eyebrow}
              title={copy.services.title}
              body={copy.services.body}
            />
            <div className="services-grid">
              {copy.services.items.map((item, index) => {
                const Icon = iconMap[item.icon] || Globe2;
                return (
                  <article
                    className="service-card"
                    key={item.title}
                    data-reveal
                    style={{ animationDelay: `${index * 35}ms` }}
                  >
                    <span className="service-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon size={25} strokeWidth={1.25} />
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                    <button
                      onClick={() => navigate("/services")}
                      aria-label={`${copy.shared.learnMore}: ${item.title}`}
                    >
                      <ArrowUpRight size={16} />
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
        <section id="products" className="products-section section-pad">
          <div className="container">
            <SectionHeading
              eyebrow={copy.products.eyebrow}
              title={copy.products.title}
              body={copy.products.body}
            />
            <div className="product-matrix">
              {copy.products.categories.map((category, index) => (
                <article
                  className="product-category featured"
                  key={category.title}
                  data-reveal
                >
                  <div className="category-top">
                    <span>{category.accent}</span>
                    <span>0{index + 1}</span>
                  </div>
                  <h3>{category.title}</h3>
                  <ul>
                    {category.items.map(item => (
                      <li key={item}>
                        <CheckCircle2 size={15} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() =>
                      navigate(PRODUCT_ROUTES[index] || "/products")
                    }
                  >
                    <span>{copy.shared.explore}</span>
                    <ArrowUpRight size={16} />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
    
<section
  id="markets"
  className="markets-section section-pad dark-section"
>
  <div className="container">

    <div className="markets-intro-row">

      <div className="markets-intro">
        <SectionHeading
          eyebrow={copy.markets.eyebrow}
          title={copy.markets.title}
          body={copy.markets.body}
          light
        />
      </div>

      <div className="markets-image" data-reveal>
        <img
          src="/markets.png"
          alt="Sancy Group global markets"
        />
      </div>

    </div>

    <div className="market-grid">

      <MarketCard
        data={copy.markets.buyer}
        icon={<Users size={31} strokeWidth={1.2} />}
        onClick={() => navigate("/buyers")}
      />

      <MarketCard
        data={copy.markets.supplier}
        icon={<Handshake size={31} strokeWidth={1.2} />}
        onClick={() => navigate("/suppliers")}
      />

    </div>

  </div>
</section>


        <section id="process" className="process-section section-pad">
          <div className="container">
            <SectionHeading
              eyebrow={copy.process.eyebrow}
              title={copy.process.title}
              body={copy.process.body}
            />
            <div className="process-rail">
              {copy.process.steps.map((step, index) => (
                <article key={step.no} data-reveal>
                  <div className="process-no">{step.no}</div>
                  <div className="process-line" />
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  {index < copy.process.steps.length - 1 && (
                    <ChevronRight className="process-arrow" size={20} />
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="global" className="global-section">

  <video
    className="global-video"
    autoPlay
    muted
    loop
    playsInline
    preload="auto"
  >
    <source src="/loopVideo.mp4" type="video/mp4" />
  </video>

  <div className="global-video-overlay" />

  <div className="global-map-lines" />

  <div className="container global-content" data-reveal>
    <span className="eyebrow light">
      11 / {copy.hero.global}
    </span>

    <h2>
      {copy.hero.subline}

      <br />
      <em>{copy.hero.sublinee}</em>
    </h2>

    <p>
      {copy.hero.globalDesc}
    </p>

    <div className="route-points">
      <span>
        <i />
        {copy.hero.turkie}
      </span>

      <span>
        <i />
        {copy.hero.international}
      </span>
    </div>
  </div>

  <div className="global-coordinate">
    {copy.hero.trade}
  </div>

</section>
        <section
          id="opportunities"
          className="opportunities-section section-pad"
        >
          <div className="container">
            <div className="opportunity-panel" data-reveal>
              <div>
                <SectionHeading
                  eyebrow={copy.opportunities.eyebrow}
                  title={copy.opportunities.title}
                  body={copy.opportunities.body}
                />
                <div className="empty-state">
                  <div className="empty-icon">
                    <Search size={20} />
                  </div>
                  <div>
                    <strong>{copy.opportunities.empty}</strong>
                    <span>
                      Connect with our team to share a requirement or offer.
                    </span>
                  </div>
                </div>
              </div>
              <div className="opportunity-actions">
                <ButtonLink variant="dark" href="#contact">
                  {copy.opportunities.primary}
                </ButtonLink>
                <ButtonLink variant="light" href="#contact">
                  {copy.opportunities.secondary}
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
        <section
          id="insights"
          className="insights-section section-pad soft-section"
        >
          <div className="container insights-layout">
            <SectionHeading
              eyebrow={copy.insights.eyebrow}
              title={copy.insights.title}
              body={copy.insights.body}
            />
            <div className="insight-empty" data-reveal>
              <BookOpen size={28} strokeWidth={1.2} />
              <strong>{copy.insights.empty}</strong>
              <span>
                Editorial content will appear here as it becomes available.
              </span>
              <a className="text-link" href="#contact">
                {copy.insights.cta}
                <MoveRight size={17} />
              </a>
            </div>
          </div>
        </section>
        <ContactSection copy={copy} />
      </main>
      <Footer copy={copy} lang={lang} navigate={navigate} />
    </div>
  );
}

function MarketCard({
  data,
  icon,
  onClick,
}: {
  data: Copy["markets"]["buyer"];
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <article className="market-card" data-reveal>
      <div className="market-icon">{icon}</div>
      <span className="eyebrow light">B2B connection</span>
      <h3>{data.title}</h3>
      <p>{data.body}</p>
      <ul>
        {data.items.map(item => (
          <li key={item}>
            <CheckCircle2 size={15} />
            {item}
          </li>
        ))}
      </ul>
      <button onClick={onClick}>
        {data.cta}
        <ArrowUpRight size={17} />
      </button>
    </article>
  );
}

function ContactSection({ copy }: { copy: Copy }) {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const change = (key: string, value: string) =>
    setForm(previous => ({ ...previous, [key]: value }));
  // const submit = (event: React.FormEvent) => {
  //   event.preventDefault();
  //   setSent(true);
  //   toast.success(copy.contact.submit, { description: copy.contact.note });
  // };

const submit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  try {
    const response = await fetch("https://formspree.io/f/meaolbqe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      setSent(true);
    } else {
      const data = await response.json();
      console.error("Formspree error:", data);
      alert("Something went wrong. Please try again.");
    }
  } catch (error) {
    console.error("Submit error:", error);
    alert("Unable to send your inquiry. Please try again.");
  }
};

  return (
    <section id="contact" className="contact-section section-pad">
      <div className="container contact-layout">
        <div className="contact-copy">
          <SectionHeading
            eyebrow={copy.contact.eyebrow}
            title={copy.contact.title}
            body={copy.contact.body}
          />
          <div className="contact-details">
            <div>
              <Mail size={17} />
              <span>
                Business inquiries
                <br />
                <strong>Available on request</strong>
              </span>
            </div>
            <div>
              <MapPin size={17} />
              <span>
                Base of operations
                <br />
                <strong>Türkiye</strong>
              </span>
            </div>
            <div>
              <Phone size={17} />
              <span>
                Direct line
                <br />
                <strong>Available on request</strong>
              </span>
            </div>
          </div>
        </div>
        <div className="contact-form-wrap" data-reveal>
          <div className="form-top">
            <span>{copy.contact.formTitle}</span>
            <span>01 / 01</span>
          </div>
          {sent ? (
            <div className="form-success">
              <CheckCircle2 size={34} />
              <h3>{copy.contact.submit}</h3>
              <p>{copy.contact.note}</p>
              <button className="text-link" onClick={() => setSent(false)}>
                Send another inquiry <MoveRight size={17} />
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="form-grid">
                {(
                  [
                    "name",
                    "company",
                    "email",
                    "phone",
                    "country",
                    "product",
                    "quantity",
                    "destination",
                  ] as const
                ).map(field => (
                  <label key={field}>
                    {copy.contact.fields[field]}
                    {/* <input
                      required={field === "name" || field === "email"}
                      type={field === "email" ? "email" : "text"}
                      value={form[field] || ""}
                      onChange={event => change(field, event.target.value)}
                    /> */}
                    <input
  name={field}
  required={field === "name" || field === "email"}
  type={field === "email" ? "email" : "text"}
  value={form[field] || ""}
  onChange={event => change(field, event.target.value)}
/>
                  </label>
                ))}
              </div>
              <label>
                {copy.contact.fields.message}
                {/* <textarea
                  rows={4}
                  value={form.message || ""}
                  onChange={event => change("message", event.target.value)}
                /> */}

                <textarea
  name="message"
  rows={4}
  value={form.message || ""}
  onChange={event => change("message", event.target.value)}
/>
              </label>
              <div className="form-bottom">
                <span>{copy.contact.note}</span>
                <button className="btn btn-gold" type="submit">
                  {copy.contact.submit}
                  <Send size={16} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function DetailPage({
  copy,
  lang,
  type,
  navigate,
}: {
  copy: Copy;
  lang: Language;
  type: string;
  navigate: (path: string) => void;
}) {
  const isAbout = type === "about";
  const isApproach = type === "our-approach";
  const isWhySancy = type === "why-sancy-group";
  const isServices = type === "services";
  const isProducts = type === "products";
  const productCategoryIndex = PRODUCT_ROUTES.findIndex(route => route === `/${type}`);
  const isProductCategory = productCategoryIndex !== -1;
  const isMarkets = ["markets", "buyers", "suppliers"].includes(type);
  const isOpp = type === "trade-opportunities";
  const isInsights = type === "insights";
  const isMarketInsights = type === "market-insights";
  const isTradeNews = type === "trade-news";
  const isContact = type === "contact";
  const title = isAbout
    ? copy.about.title
    : isApproach
      ? copy.intro.title
      : isWhySancy
        ? copy.why.title
        : isMarketInsights
          ? copy.marketInsights.title
          : isTradeNews
            ? copy.tradeNews.title
            : isServices
            ? copy.services.title
            : isProducts
              ? copy.products.title
              : isProductCategory
                ? copy.products.categories[productCategoryIndex].title
                : isMarkets
                  ? copy.markets.title
                  : isOpp
                    ? copy.opportunities.title
                    : isContact
                      ? copy.contact.title
                      : copy.insights.title;
  const eyebrow = isAbout
    ? copy.about.eyebrow
    : isApproach
      ? copy.intro.eyebrow
      : isWhySancy
        ? copy.why.eyebrow
        : isMarketInsights
          ? copy.marketInsights.eyebrow
          : isTradeNews
            ? copy.tradeNews.eyebrow
            : isServices
            ? copy.services.eyebrow
            : isProducts || isProductCategory
              ? copy.products.eyebrow
              : isMarkets
                ? copy.markets.eyebrow
                : isOpp
                  ? copy.opportunities.eyebrow
                  : isContact
                    ? copy.contact.eyebrow
                    : copy.insights.eyebrow;
  useEffect(() => {
    document.title = `${title} — Sancy Group`;
  }, [title]);
  return (
    <div id="sancy-reveal-root" className="internal-page">
      <div className="internal-page-video" aria-hidden="true">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/loopVideo.mp4" type="video/mp4" />
        </video>
        <div className="internal-page-video-overlay" />
      </div>

      <section className="page-hero">
        <div className="container page-hero-content">
          <span className="eyebrow light">{eyebrow}</span>
          <h1>{title}</h1>
          <p>
            {isAbout
              ? copy.about.body[0]
              : isApproach
                ? copy.intro.body[0]
                : isWhySancy
                  ? copy.why.body
                  : isMarketInsights
                  ? copy.marketInsights.body
                  : isTradeNews
                    ? copy.tradeNews.body
                    : isServices
                      ? copy.services.body
                      : isProducts || isProductCategory
                        ? copy.products.body
                        : isMarkets
                          ? copy.markets.body
                          : isOpp
                            ? copy.opportunities.body
                            : isContact
                              ? copy.contact.body
                              : copy.insights.body}
          </p>
        </div>
        <div className="page-hero-index">SANCY / {type.toUpperCase()}</div>
      </section>
      <main>
        {isAbout && <AboutPage copy={copy} />}
        {isApproach && <ApproachPage copy={copy} />}
        {isWhySancy && <WhySancyPage copy={copy} />}
        {isMarketInsights && <MarketInsightsPage copy={copy} navigate={navigate} />}
        {isTradeNews && <TradeNewsPage copy={copy} lang={lang} />}
        {isServices && <ServicesPage copy={copy} navigate={navigate} />}
        {(isProducts || isProductCategory) && (
          <ProductsPage
            copy={copy}
            categoryIndex={isProducts ? null : productCategoryIndex}
            navigate={navigate}
          />
        )}
        {isMarkets && (
          <MarketsPage copy={copy} type={type} navigate={navigate} />
        )}
        {isOpp && <OpportunitiesPage copy={copy} navigate={navigate} />}
        {isContact && <ContactSection copy={copy} />}
        {isInsights && <InsightsPage copy={copy} navigate={navigate} />}
      </main>
      <Footer copy={copy} lang={lang} navigate={navigate} />
    </div>
  );
}

function AboutPage({ copy }: { copy: Copy }) {
  return (
    <section className="section-pad">
      <div className="container about-page-grid">
        <div className="about-page-intro">
          <span className="large-index">03</span>
          <blockquote>“{copy.about.quote}”</blockquote>
        </div>
        <div className="about-body">
          {copy.about.body.map(paragraph => (
            <p key={paragraph} data-reveal>
              {paragraph}
            </p>
          ))}
          <div className="manifesto-card" data-reveal>
            <Sparkles size={22} />
            <strong>
              {copy.hero.line}
              <br />
              {copy.hero.linee}
              <br />
             {copy.hero.lineee}
            </strong>
            <span>{copy.hero.subline} {copy.hero.sublinee}</span>
          </div>
        </div>
      </div>
      <div className="container value-band">
        <div>
          <span>2023</span>
          <p>{copy.about.establishedinturkiye}</p>
        </div>
        <div>
          <span>1000+</span>
          <p>{copy.about.structuredtradeapprouch}</p>
        </div>
        <div>
          <span>∞</span>
          <p>{copy.about.longtearm}</p>
        </div>
      </div>
    </section>
  );
}

function ApproachPage({ copy }: { copy: Copy }) {
  return (
    <section className="section-pad soft-section approach-page">
      <div className="container">
        <div className="focus-page-lead" data-reveal>
          <div>
            <span className="large-index">01</span>
          </div>
          <div className="focus-page-lead-copy">
            <SectionHeading
              eyebrow={copy.intro.eyebrow}
              title={copy.intro.title}
            />
            {copy.intro.body.map(paragraph => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="focus-page-process" data-reveal>
          <SectionHeading
            eyebrow={copy.process.eyebrow}
            title={copy.process.title}
            body={copy.process.body}
          />
          <div className="process-rail">
            {copy.process.steps.map(step => (
              <article key={step.no}>
                <span className="process-no">{step.no}</span>
                <div className="process-line" />
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhySancyPage({ copy }: { copy: Copy }) {
  return (
    <section className="section-pad dark-section why-section why-sancy-page">
      <div className="container">
        <SectionHeading
          eyebrow={copy.why.eyebrow}
          title={copy.why.title}
          body={copy.why.body}
          light
        />
        <div className="why-grid">
          {copy.why.items.map((item, index) => (
            <article className="why-card" key={item.title} data-reveal>
              <span className="card-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Globe2 size={28} strokeWidth={1.15} />
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesPage({
  copy,
  navigate,
}: {
  copy: Copy;
  navigate: (path: string) => void;
}) {
  return (
    <section className="section-pad soft-section">
      <div className="container">
        <div className="services-grid large-services">
          {copy.services.items.map((item, index) => {
            const Icon = iconMap[item.icon] || Globe2;
            return (
              <article className="service-card" key={item.title} data-reveal>
                <span className="service-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Icon size={28} strokeWidth={1.25} />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <button onClick={() => navigate("/contact")}>
                  <ArrowUpRight size={16} />
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
function ProductsPage({
  copy,
  categoryIndex,
  navigate,
}: {
  copy: Copy;
  categoryIndex: number | null;
  navigate: (path: string) => void;
}) {
  const categories =
    categoryIndex === null
      ? copy.products.categories
      : copy.products.categories.slice(categoryIndex, categoryIndex + 1);
  return (
    <section className="section-pad">
      <div className="container">
        <div className="product-matrix large-products">
          {categories.map((category, index) => (
            <article
              className="product-category featured"
              key={category.title}
              data-reveal
            >
              <div className="category-top">
                <span>{category.accent}</span>
                <span>0{index + 1}</span>
              </div>
              <h3>{category.title}</h3>
              <ul>
                {category.items.map(item => (
                  <li key={item}>
                    <CheckCircle2 size={15} />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/contact")}>
                <span>{copy.shared.availableOnRequest}</span>
                <ArrowUpRight size={16} />
              </button>
            </article>
          ))}
        </div>
        {categoryIndex === 0 && (
          <div className="food-note" data-reveal>
            <Wheat size={27} />
            <div>
              <strong>
                Food & agriculture is a core business vertical of Sancy Group.
              </strong>
              <p>
                Product availability is subject to supplier verification,
                specifications, quantity and market requirements.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
function MarketsPage({
  copy,
  type,
  navigate,
}: {
  copy: Copy;
  type: string;
  navigate: (path: string) => void;
}) {
  const showBuyer = type !== "suppliers";
  const showSupplier = type !== "buyers";
  return (
    <section className="section-pad dark-section">
      <div className="container">
        <div className="market-grid market-page-grid">
          {showBuyer && (
            <MarketCard
              data={copy.markets.buyer}
              icon={<Users size={31} strokeWidth={1.2} />}
              onClick={() => navigate("/contact")}
            />
          )}
          {showSupplier && (
            <MarketCard
              data={copy.markets.supplier}
              icon={<Handshake size={31} strokeWidth={1.2} />}
              onClick={() => navigate("/contact")}
            />
          )}
        </div>
        <div className="map-panel" data-reveal>
          <div className="map-orbit orbit-one" />
          <div className="map-orbit orbit-two" />
          <Globe2 size={86} strokeWidth={0.7} />
          <span>Türkiye</span>
          <small>Supply / Demand / Connection</small>
        </div>
      </div>
    </section>
  );
}
function OpportunitiesPage({
  copy,
  navigate,
}: {
  copy: Copy;
  navigate: (path: string) => void;
}) {
  return (
    <section className="section-pad">
      <div className="container">
        <div className="opportunity-page-card" data-reveal>
          <div className="empty-icon">
            <Search size={22} />
          </div>
          <h2>{copy.opportunities.empty}</h2>
          <p>
            There are no published sourcing requirements or supplier offers at
            this time. Share your brief to be considered for future
            opportunities.
          </p>
          <div className="opportunity-actions">
            <ButtonLink variant="dark" onClick={() => navigate("/contact")}>
              {copy.opportunities.primary}
            </ButtonLink>
            <ButtonLink variant="light" onClick={() => navigate("/contact")}>
              {copy.opportunities.secondary}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
function InsightsPage({
  copy,
  navigate,
}: {
  copy: Copy;
  navigate: (path: string) => void;
}) {
  return (
    <section className="section-pad soft-section insights-hub-page">
      <div className="container">
        <div className="insights-hub-intro" data-reveal>
          <div className="insights-hub-index">
            <span>09</span>
            <small>INTELLIGENCE / EDITORIAL</small>
          </div>
          <div>
            <SectionHeading
              eyebrow={copy.insights.eyebrow}
              title={copy.insights.title}
              body={copy.insights.body}
            />
          </div>
        </div>

        <div className="insights-hub-grid">
          <article className="insights-feature-card" data-reveal>
            <span className="insights-card-kicker">01 / MARKET</span>
            <div className="insights-feature-icon"><TrendingUp size={26} strokeWidth={1.25} /></div>
            <h2>{copy.insights.marketTitle}</h2>
            <p>{copy.insights.marketBody}</p>
            <button className="text-link insights-action" onClick={() => navigate("/market-insights")}>
              {copy.insights.explore}
              <ArrowUpRight size={16} />
            </button>
          </article>

          <article className="insights-news-card" data-reveal>
            <span className="insights-card-kicker">02 / LIVE</span>
            <div className="insights-news-topline">
              <div className="insights-live-dot" />
              <span>{copy.tradeNews.live}</span>
            </div>
            <h2>{copy.insights.newsTitle}</h2>
            <p>{copy.insights.newsBody}</p>
            <button className="text-link insights-action" onClick={() => navigate("/trade-news")}>
              {copy.insights.explore}
              <ArrowUpRight size={16} />
            </button>
          </article>
        </div>

        <div className="insights-principles" data-reveal>
          <div>
            <span className="eyebrow">/ EDITORIAL PRINCIPLE</span>
            <h3>{copy.insights.empty}</h3>
          </div>
          <div className="insights-principles-rule" />
          <p>
            We separate market context from confirmed commercial information. Published perspectives are designed to help frame a conversation; specific supply, price, availability and logistics remain subject to verification.
          </p>
        </div>
      </div>
    </section>
  );
}

function MarketInsightsPage({
  copy,
  navigate,
}: {
  copy: Copy;
  navigate: (path: string) => void;
}) {
  const iconMapForSignal: Record<string, typeof Globe2> = {
    globe: Globe2,
    truck: Truck,
    chart: BarChart3,
    scale: Scale,
  };

  return (
    <section className="section-pad soft-section market-insights-page">
      <div className="container">
        <div className="market-insights-lead" data-reveal>
          <span className="large-index">09</span>
          <div className="market-insights-lead-copy">
            <SectionHeading
              eyebrow={copy.marketInsights.eyebrow}
              title={copy.marketInsights.leadTitle}
              body={copy.marketInsights.leadBody}
            />
          </div>
        </div>

        <div className="market-insights-signal-grid">
          {copy.marketInsights.signals.map((signal, index) => {
            const Icon = iconMapForSignal[signal.icon] || Globe2;
            return (
              <article className="market-insights-signal" key={signal.title} data-reveal>
                <div className="market-insights-signal-top">
                  <span>0{index + 1}</span>
                  <Icon size={23} strokeWidth={1.2} />
                </div>
                <h3>{signal.title}</h3>
                <p>{signal.body}</p>
              </article>
            );
          })}
        </div>

        <div className="market-insights-section-head" data-reveal>
          <span className="eyebrow">/ {copy.marketInsights.lensesTitle}</span>
          <h2>{copy.marketInsights.lensesTitle}</h2>
        </div>
        <div className="market-insights-card-grid">
          {copy.marketInsights.sectors.map((item, index) => (
            <article className="market-insights-info-card" key={item.title} data-reveal>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>

        <div className="market-insights-region-block" data-reveal>
          <div className="market-insights-region-head">
            <span className="eyebrow">/ {copy.marketInsights.regionsTitle}</span>
            <h2>{copy.marketInsights.regionsTitle}</h2>
          </div>
          <div className="market-insights-region-list">
            {copy.marketInsights.regions.map((item, index) => (
              <div className="market-insights-region" key={item.title}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="market-insights-cta" data-reveal>
          <div>
            <span className="eyebrow light">/ {copy.hero.next} </span>
            <h2>{copy.marketInsights.title}</h2>
          </div>
          <button className="text-link light" onClick={() => navigate("/contact")}>
            {copy.marketInsights.cta}
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

function TradeNewsPage({
  copy,
  lang,
}: {
  copy: Copy;
  lang: Language;
}) {
  const readCachedNews = () => {
    try {
      const raw = window.localStorage.getItem(TRADE_NEWS_CACHE_KEY);
      if (!raw) return { articles: [] as TradeNewsArticle[], updatedAt: null as Date | null };

      const cached = JSON.parse(raw) as {
        articles?: TradeNewsArticle[];
        updatedAt?: number;
      };

      if (!Array.isArray(cached.articles)) {
        return { articles: [] as TradeNewsArticle[], updatedAt: null as Date | null };
      }

      return {
        articles: cached.articles,
        updatedAt: cached.updatedAt ? new Date(cached.updatedAt) : null,
      };
    } catch {
      return { articles: [] as TradeNewsArticle[], updatedAt: null as Date | null };
    }
  };

  const cached = readCachedNews();
  const cachedLive = cached.articles.filter(article =>
    !STATIC_TRADE_NEWS.some(staticArticle => staticArticle.url === article.url)
  );

  const [articles, setArticles] = useState<TradeNewsArticle[]>([
    ...STATIC_TRADE_NEWS,
    ...cachedLive,
  ].slice(0, 18));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(cached.updatedAt);

  const fetchNews = async () => {
    setRefreshing(true);
    setError(false);

    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => controller.abort(),
      TRADE_NEWS_FETCH_TIMEOUT
    );

    try {
      const response = await fetch(`${TRADE_NEWS_API}&_=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`News request failed: ${response.status}`);

      const data = (await response.json()) as {
        articles?: TradeNewsArticle[];
        items?: TradeNewsArticle[];
      };

      const sourceArticles = Array.isArray(data.articles)
        ? data.articles
        : Array.isArray(data.items)
          ? data.items
          : [];

      const seen = new Set<string>();
      const staticUrls = new Set(STATIC_TRADE_NEWS.map(article => article.url));
      const liveArticles = sourceArticles.filter(article => {
        if (!article.url || !article.title || seen.has(article.url) || staticUrls.has(article.url)) {
          return false;
        }
        seen.add(article.url);
        return true;
      });

      if (!liveArticles.length) throw new Error("No live trade articles returned");

      const now = new Date();
      setArticles([...STATIC_TRADE_NEWS, ...liveArticles].slice(0, 18));
      setUpdatedAt(now);

      try {
        window.localStorage.setItem(
          TRADE_NEWS_CACHE_KEY,
          JSON.stringify({
            articles: liveArticles.slice(0, 15),
            updatedAt: now.getTime(),
          })
        );
      } catch {
        // Local storage can be unavailable in private browsing; the page still works.
      }
    } catch (requestError) {
      console.warn("Trade news background update skipped", requestError);
      setError(true);
    } finally {
      window.clearTimeout(timeout);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // The page is rendered immediately from static/cache data.
    // Live news is refreshed silently in the background.
    void fetchNews();

    const interval = window.setInterval(() => {
      void fetchNews();
    }, TRADE_NEWS_CACHE_TTL);

    return () => window.clearInterval(interval);
  }, []);

  const formatDate = (value?: string) => {
    if (!value) return "";
    const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
    if (!match) return value;

    const date = new Date(
      Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6])
      )
    );

    return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  return (
    <section className="section-pad soft-section trade-news-page">
      <div className="container">
        <div className="trade-news-toolbar" data-reveal>
          <div className="trade-news-status">
            <span className="trade-news-live-dot" />
            <span>{copy.tradeNews.live}</span>
            {updatedAt && (
              <small>
                {copy.tradeNews.updated} {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </small>
            )}
          </div>
          <button
            className="trade-news-refresh"
            onClick={fetchNews}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? "trade-news-spin" : ""} />
            {copy.tradeNews.refresh}
          </button>
        </div>

        <div className="trade-news-grid">
          {articles.map((article, index) => (
            <article className="trade-news-card" key={article.url} data-reveal>
              <a
                className={`trade-news-card-media ${article.socialimage ? "" : "is-fallback"}`}
                href={article.url}
                target="_blank"
                rel="noreferrer"
              >
                {article.socialimage && (
                  <img
                    src={article.socialimage}
                    alt=""
                    loading="lazy"
                    onError={event => {
                      const img = event.currentTarget;
                      img.style.display = "none";
                      const parent = img.parentElement;
                      parent?.classList.add("is-fallback");
                      if (parent && !parent.querySelector(".trade-news-image-fallback")) {
                        const fallback = document.createElement("span");
                        fallback.className = "trade-news-image-fallback";
                        fallback.textContent = article.sourcecountry || "GLOBAL TRADE";
                        parent.prepend(fallback);
                      }
                    }}
                  />
                )}
                <span>{String(index + 1).padStart(2, "0")}</span>
              </a>
              <div className="trade-news-card-body">
                <div className="trade-news-meta">
                  <span>{article.domain || "Global source"}</span>
                  <span>{formatDate(article.seendate)}</span>
                </div>
                <h3>{article.title}</h3>
                <div className="trade-news-card-footer">
                  <small>{article.sourcecountry || copy.tradeNews.source}</small>
                  <a href={article.url} target="_blank" rel="noreferrer">
                    {copy.tradeNews.open}
                    <ArrowUpRight size={15} />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {error && (
          <div className="trade-news-soft-error">
            {cachedLive.length
              ? "Live update unavailable — showing the latest cached news."
              : copy.tradeNews.error}
          </div>
        )}
      </div>
    </section>
  );
}

function Footer({
  copy,
  lang,
  navigate,
}: {
  copy: Copy;
  lang: Language;
  navigate: (path: string) => void;
}) {
  return (
    <footer className="site-footer">
      <div className="container">

        <div className="footer-top">

          {/* Brand */}
          <div className="footer-brand">
            <Logo light />

            <p>{copy.footer.descriptor}</p>

            <span className="footer-tagline">
             {copy.hero.line}
              <br />
              {copy.hero.linee}
              <br />
              {copy.hero.lineee}
            </span>
          </div>

          {/* Company */}
          <div className="footer-col">
            <span>{copy.footer.company}</span>

            <button onClick={() => navigate("/about")}>
              {copy.nav.about}
            </button>

            <button onClick={() => navigate("/services")}>
              {copy.nav.services}
            </button>

            <button onClick={() => navigate("/contact")}>
              {copy.nav.contact}
            </button>
          </div>

          {/* Business */}
          <div className="footer-col">
            <span>{copy.footer.business}</span>

            <button onClick={() => navigate("/food-agriculture")}>
              {copy.nav.food}
            </button>

            <button onClick={() => navigate("/products")}>
              {copy.nav.products}
            </button>

            <button onClick={() => navigate("/trade-opportunities")}>
              {copy.nav.opportunities}
            </button>
          </div>

          {/* Connect */}
          <div className="footer-col">
            <span>{copy.footer.connect}</span>

            <button onClick={() => navigate("/buyers")}>
              {copy.nav.buyers}
            </button>

            <button onClick={() => navigate("/suppliers")}>
              {copy.nav.suppliers}
            </button>

            <button onClick={() => navigate("/contact")}>
              {copy.nav.quotation}
            </button>
          </div>

        </div>

        {/* Bottom */}
        <div className="footer-bottom">

          <span>
            {copy.hero.copyright}
          </span>

          <div className="footer-legal">
            <button
              onClick={() => navigate(lang === "tr" ? "/tr/privacy-policy" : "/privacy-policy")}
            >
              {lang === "tr" ? "Gizlilik Politikası" : "Privacy Policy"}
            </button>

            <button onClick={() => navigate("/terms")}>
            {copy.hero.terms}
            </button>
          </div>

          <span className="footer-language">
            EN / TR
          </span>

          <span className="footer-route">
            {copy.hero.subline} {copy.hero.sublinee}
            
          </span>

        </div>

      </div>
    </footer>
  );
}

// ========================================
// PRIVACY POLICY
// ========================================

function PrivacyPolicy({ lang }: { lang: Language }) {
  const isTurkish = lang === "tr";

  return (
    <main className="legal-page">
      <div className="container">
        <span className="eyebrow">
          {isTurkish ? "Yasal / Gizlilik" : "Legal / Privacy"}
        </span>

        <h1>{isTurkish ? "Gizlilik Politikası" : "Privacy Policy"}</h1>

        <p className="legal-intro">
          {isTurkish
            ? "Sancy Group, gizliliğinize saygı duyar ve web sitemiz aracılığıyla paylaştığınız kişisel bilgilerin korunmasına önem verir."
            : "Sancy Group respects your privacy and is committed to protecting the personal information you provide through our website."}
        </p>

        <section>
          <h2>
            {isTurkish ? "Topladığımız Bilgiler" : "Information We Collect"}
          </h2>
          <p>
            {isTurkish
              ? "Web sitemiz üzerinden bizimle iletişime geçtiğinizde adınız, şirketiniz, e-posta adresiniz, telefon numaranız, ülkeniz, ürün gereksinimleriniz, miktar, varış yeri ve mesajınız gibi bilgileri toplayabiliriz."
              : "When you contact us through our website, we may collect information such as your name, company, email address, phone number, country, product requirements, quantity, destination and message."}
          </p>
        </section>

        <section>
          <h2>
            {isTurkish ? "Bilgilerinizi Nasıl Kullanıyoruz" : "How We Use Your Information"}
          </h2>
          <p>
            {isTurkish
              ? "Paylaştığınız bilgileri ticari taleplere, teklif isteklerine, tedarik taleplerine ve hizmetlerimizle ilgili diğer iletişimlere yanıt vermek amacıyla kullanırız."
              : "We use the information you provide to respond to business inquiries, quotations, sourcing requests and other communications related to our services."}
          </p>
        </section>

        <section>
          <h2>
            {isTurkish ? "Veri Güvenliği" : "Data Protection"}
          </h2>
          <p>
            {isTurkish
              ? "Web sitemiz üzerinden gönderilen bilgileri yetkisiz erişim, ifşa veya kötüye kullanıma karşı korumak için makul güvenlik önlemleri alıyoruz."
              : "We take reasonable measures to protect the information submitted through our website against unauthorized access, disclosure or misuse."}
          </p>
        </section>

        <section>
          <h2>{isTurkish ? "Üçüncü Taraf Hizmetleri" : "Third-Party Services"}</h2>
          <p>
            {isTurkish
              ? "İletişim formumuzun iletilmesi ve e-posta işlemleri için üçüncü taraf hizmet sağlayıcıları kullanılabilir. Bu hizmetler, gönderdiğiniz bilgileri formun işlenmesi ve size yanıt verilmesi amacıyla işleyebilir."
              : "We may use third-party service providers to process and deliver contact-form submissions and email communications. These providers may process the information you submit for the purpose of handling your inquiry and enabling us to respond."}
          </p>
        </section>

        <section>
          <h2>{isTurkish ? "Veri Saklama" : "Data Retention"}</h2>
          <p>
            {isTurkish
              ? "İletişim ve ticari talepler için gerekli olduğu sürece gönderdiğiniz bilgileri saklayabiliriz. Saklama süresi, talebin niteliğine ve yasal veya ticari gerekliliklere göre değişebilir."
              : "We may retain submitted information for as long as reasonably necessary to handle business communications and inquiries. Retention periods may vary depending on the nature of the inquiry and applicable legal or business requirements."}
          </p>
        </section>

        <section>
          <h2>{isTurkish ? "Haklarınız" : "Your Rights"}</h2>
          <p>
            {isTurkish
              ? "Kişisel bilgilerinizle ilgili talepleriniz veya gizlilik uygulamalarımız hakkında sorularınız varsa bizimle iletişime geçebilirsiniz. Uygulanabilir mevzuata tabi olarak erişim, düzeltme veya diğer veri koruma haklarınız bulunabilir."
              : "If you have questions about your personal information or our privacy practices, you may contact us. Depending on applicable law, you may have rights relating to access, correction or other data-protection matters."}
          </p>
        </section>

        <section>
          <h2>{isTurkish ? "İletişim" : "Contact"}</h2>
          <p>
            {isTurkish
              ? "Gizlilikle ilgili sorularınız için web sitemizdeki iletişim formu üzerinden bizimle iletişime geçebilirsiniz."
              : "For privacy-related questions, please contact us through our website contact form."}
          </p>
        </section>

        <div className="legal-back">
          <button
            className="text-link"
            onClick={() => window.history.back()}
          >
            {isTurkish ? "Geri dön" : "Go back"}
            <MoveRight size={17} />
          </button>
        </div>
      </div>
    </main>
  );
}

// ========================================
// PREMIUM SANCY GROUP PRELOADER
// ========================================

function SancyPreloader() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    let frame = 0;
    let start = performance.now();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      setProgress(100);

      window.setTimeout(() => {
        setExiting(true);
        window.setTimeout(() => setVisible(false), 700);
      }, 180);
    };

    const handleLoad = () => finish();

    if (document.readyState === "complete") {
      window.setTimeout(finish, 450);
    } else {
      window.addEventListener("load", handleLoad, { once: true });
    }

    const animate = (now: number) => {
      const elapsed = now - start;
      const target = Math.min(92, Math.round((elapsed / 1800) * 92));

      setProgress(current => Math.max(current, target));

      if (!finished) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    const safetyTimer = window.setTimeout(finish, 4500);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(safetyTimer);
      window.removeEventListener("load", handleLoad);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`sancy-preloader${exiting ? " sancy-preloader--exit" : ""}`}
      role="status"
      aria-label="Loading Sancy Group"
      aria-live="polite"
    >
      <div className="sancy-preloader__grid" aria-hidden="true" />

      <div className="sancy-preloader__corner sancy-preloader__corner--tl" aria-hidden="true" />
      <div className="sancy-preloader__corner sancy-preloader__corner--br" aria-hidden="true" />

      <div className="sancy-preloader__inner">
        <div className="sancy-preloader__brand">
          <img
            src="/sancygruoplogo.png"
            alt="Sancy Group"
            draggable="false"
          />
        </div>

        <div className="sancy-preloader__identity">
          <span>INTERNATIONAL TRADING</span>
          <span className="sancy-preloader__identity-dot">·</span>
          <span>GLOBAL SOURCING</span>
        </div>

        <div className="sancy-preloader__loader" aria-hidden="true">
          <span
            className="sancy-preloader__loader-bar"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>

        <div className="sancy-preloader__meta">
          <span>Türkiye · Global Markets</span>
          <span>{String(progress).padStart(2, "0")}%</span>
        </div>
      </div>
    </div>
  );
}

// ========================================
// MAIN APP
// ========================================

function App() {
  const [location, navigate] = useLocation();
  const [lang, setLang] = useState<Language>(() =>
    window.location.pathname.startsWith("/tr") ? "tr" : "en"
  );
  const copy = translations[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      lang === "en"
        ? "Sancy Group | International Trading & Global Sourcing"
        : "Sancy Group | Uluslararası Ticaret & Küresel Tedarik";
  }, [lang]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        }),
      { threshold: 0.08 }
    );
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [location, lang]);
  const cleanLocation =
    location === "/tr" || location.startsWith("/tr/")
      ? location.slice(3) || "/"
      : location;
  const route = cleanLocation.startsWith("/")
    ? cleanLocation.slice(1) || "home"
    : cleanLocation;
  const setLanguage = (next: Language) => {
    setLang(next);
    navigate(next === "tr" ? `/tr${cleanLocation}` : cleanLocation);
  };
  const page =
    route === "home" ? (
      <Home copy={copy} lang={lang} navigate={navigate} />
    ) : route === "privacy-policy" ? (
      <PrivacyPolicy lang={lang} />
    ) : (
      <DetailPage copy={copy} lang={lang} type={route} navigate={navigate} />
    );
  return (
    <>
      <SancyPreloader />

      <div className="app-shell">
        <Header
          copy={copy}
          lang={lang}
          setLang={setLanguage}
          navigate={navigate}
        />
        {page}
      </div>
    </>
  );
}

export default App;
