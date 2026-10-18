/**
 * Sample content copied from the Figma file. Used while MASO_CONFIG.WP_URL
 * is empty, so the site can be reviewed before the WordPress API exists.
 *
 * Every object has exactly the shape the WordPress endpoints return
 * (docs/WORDPRESS_API.md): links are site paths ("/shop/beds") and images
 * are { src, width, height, alt }. Maso.url.page() / Maso.url.media() turn
 * them into links and files of this static site.
 */
(function () {
  "use strict";

  const heroPoster = { src: "/images/home/hero-poster.jpg", width: 1920, height: 1080, alt: "" };

  /* ------------------------------------------------------------------ */
  /* Site settings (GET /maso/v1/settings)                               */
  /* ------------------------------------------------------------------ */

  const settings = {
    headerNav: [
      { label: "محصولات", href: "/shop" },
      { label: "فروشگاه", href: "/shop" },
    ],
    loginBackground: { src: "", poster: { src: "/images/auth/login-bg.jpg", width: 1440, height: 874, alt: "" } },
    popularSearches: ["مبل راحتی", "تخت دونفره", "میز ناهارخوری", "صندلی", "کنسول و آینه"],
    mobileNav: [
      { label: "فروشگاه", href: "/shop" },
      { label: "سفارش اختصاصی", href: "/custom-order" },
      { label: "بلاگ", href: "/blog" },
      { label: "پیگیری سفارش", href: "/profile/orders" },
      { label: "درباره ما", href: "/about" },
      { label: "تماس با ما", href: "/contact" },
    ],
    footer: {
      columns: [
        [
          { label: "فروشگاه", href: "/shop" },
          { label: "پیگیری سفارش", href: "/profile/orders" },
          { label: "درباره ما", href: "/about" },
        ],
        [
          { label: "تماس با ما", href: "/contact" },
          { label: "سفارش اختصاصی", href: "/custom-order" },
          { label: "بلاگ", href: "/blog" },
        ],
      ],
      address: { label: "آدرس دفتر مرکزی", value: "استان گلستان- شهرستان کردکوی - ابتدای جاده کردکوی -بندرترکمن" },
      phones: { label: "مشاوره و فروش", values: ["09199900671", "017-34341679"] },
      email: { label: "ایمیل", value: "Info@masogroup.co" },
      socials: { instagram: "https://instagram.com/", telegram: "https://t.me/", whatsapp: "https://wa.me/989199900671" },
      copyright:
        "تمامی کپی رایت © این سایت مربوط به برند ماسو می‌باشد | ۱۴۰۵ هر گونه استفاده بدون اجازه از محتوا منجر به پیگرد قانونی خواهد شد.",
      about:
        "لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد، کتابهای زیادی در شصت و سه درصد گذشته حال و آینده، شناخت فراوان جامعه و متخصصان را می طلبد، تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه ای علی الخصوص طراحان خلاقی، و فرهنگ پیشرو در زبان فارسی ایجاد کرد، در این صورت می توان امید داشت که تمام و دشواری موجود در ارائه راهکارها، و شرایط سخت تایپ به پایان رسد و زمان مورد نیاز شامل حروفچینی دستاوردهای اصلی، و جوابگوی سوالات پیوسته اهل دنیای موجود طراحی اساسا مورد استفاده قرار گیرد.",
      legal: [
        { label: "شرایط استفاده", href: "/terms-of-use" },
        { label: "شرایط بازگشت", href: "/returns" },
        { label: "قوانین و مقررارت", href: "/terms" },
      ],
      video: { src: "", poster: heroPoster },
    },
  };

  /* ------------------------------------------------------------------ */
  /* Shop (GET /maso/v1/shop/…)                                          */
  /* ------------------------------------------------------------------ */

  const cat = (slug, name, file, iconW) => ({
    slug,
    name,
    image: { src: `/images/shop/${file}.webp`, width: 378, height: 150, alt: "" },
    icon: { src: `/images/shop/${file}-icon.webp`, width: iconW, height: 48, alt: "" },
  });

  /** Rail order = reading order (first item on the right) */
  const categories = [
    cat("furniture", "مبلمان", "cat-furniture", 64),
    cat("beds", "تخت و سرویس خواب", "cat-beds", 83),
    cat("bedroom", "مبلمان اتاق خواب", "cat-bedroom-furniture", 34),
    cat("living-room", "پذیرایی و نشیمن", "cat-living", 97),
    cat("dining", "غذا خوری و بار", "cat-dining", 85),
    cat("office", "اداری و کار", "cat-office", 95),
    cat("kids", "کودک و نوجوان", "cat-kids", 60),
    cat("baby", "نوزاد", "cat-baby", 79),
  ];

  const swatch = (name, n) => ({ name, image: { src: `/images/shop/swatch-${n}.webp`, width: 96, height: 96, alt: name } });
  const swatches = [
    swatch("گردو", 1),
    swatch("راش تیره", 2),
    swatch("راش روشن", 3),
    swatch("بلوط", 1),
    swatch("ونگه", 2),
    swatch("افرا", 3),
    swatch("ملچ", 1),
    swatch("توسکا", 2),
  ];

  const description =
    "مبل چوبی هفت نفره‌ای لوکس و بی‌نظیر؛ ساخته شده از چوب مرغوب با طراحی ماندگار برای تجربه‌ای متفاوت و شیک در هر لحظه";

  /**
   * 30 sample products. `categories`, `facets` and `createdAt` are only
   * used by the sample filtering below; the API returns ProductSummary.
   */
  const products = Array.from({ length: 30 }, (_, i) => {
    const price = 1_480_000_000 - i * 37_000_000;
    const discounted = i % 3 !== 2;
    return {
      slug: `izo-sofa-${i + 1}`,
      name: "مبدل ایزو",
      capacity: "۱ الی ۷ نفره",
      shortDescription: description,
      price,
      regularPrice: discounted ? Math.round(price / 0.9 / 1000) * 1000 : undefined,
      image: { src: "/images/shop/product-izo.jpg", width: 644, height: 600, alt: "مبدل ایزو" },
      swatches,
      inStock: i % 5 !== 4,
      categories: ["furniture", categories[i % categories.length].slug],
      facets: {
        wood: [["walnut", "beech", "oak"][i % 3]],
        material: [["solid", "veneer"][i % 2]],
        space: [["private", "living", "office"][i % 3]],
      },
      createdAt: new Date(Date.UTC(2026, 8, 30 - i)).toISOString(),
    };
  });

  const facets = [
    {
      key: "wood",
      label: "رنگ چوب",
      options: [
        { value: "walnut", label: "گردویی" },
        { value: "beech", label: "راش" },
        { value: "oak", label: "بلوط" },
      ],
    },
    {
      key: "material",
      label: "جنس",
      options: [
        { value: "solid", label: "چوب تمام" },
        { value: "veneer", label: "روکش طبیعی" },
      ],
    },
    {
      key: "space",
      label: "مناسب فضای",
      options: [
        { value: "private", label: "نواحی خصوصی" },
        { value: "living", label: "نشیمن" },
        { value: "office", label: "دفتر کار" },
        { value: "kids", label: "اتاق کودک" },
        { value: "outdoor", label: "فضای باز" },
      ],
    },
  ];

  const promo = {
    title: "مبدل لیمیتد ادیشن مدل لاین",
    description,
    cta: { label: "بررسی محصول", href: "/product/line-limited-edition" },
    image: { src: "/images/shop/promo-line-chair.webp", width: 904, height: 678, alt: "مبل تک نفره مدل لاین" },
  };

  /* ------------------------------------------------------------------ */
  /* Product detail (GET /maso/v1/shop/products/:slug)                   */
  /* ------------------------------------------------------------------ */

  const swatchImg = (src, alt) => ({ src, width: 96, height: 96, alt });

  const productDetail = {
    name: "تخت دونفره مدل همدم",
    deliveryDays: 45,
    breadcrumbs: [
      { label: "فروشگاه", href: "/shop" },
      { label: "تخت و سرویس خواب", href: "/shop/beds" },
      { label: "تخت", href: "/shop/beds" },
    ],
    images: [
      { src: "/images/product/hamdam-1.jpg", width: 680, height: 680, alt: "تخت دونفره همدم با دو پاتختی" },
      { src: "/images/product/hamdam-2.jpg", width: 680, height: 680, alt: "نمای نزدیک پایه و فریم چوب گردو" },
      { src: "/images/product/hamdam-1.jpg", width: 680, height: 680, alt: "تخت دونفره همدم" },
    ],
    optionGroups: [
      {
        key: "size",
        label: "سایز‌ها",
        selectedLabel: "انتخاب‌ها",
        pickerTitle: "سایز‌ها",
        kind: "size",
        options: [
          { id: "queen", name: "کویین", detail: "عرض ۱۶۰cm", price: 1_500_000_000 },
          { id: "king", name: "کینگ", detail: "عرض ۲۰۰cm", price: 2_500_000_000 },
        ],
      },
      {
        key: "wood",
        label: "رنگ چوب",
        pickerTitle: "رنگ چوب",
        kind: "swatch",
        options: [
          { id: "beech-walnut", name: "چوب راش - رنگ گردویی", priceDelta: 0, swatch: swatchImg("/images/shop/swatch-1.webp", "رنگ گردویی") },
          { id: "beech-veneer", name: "چوب راش - روکش طرح چوب", priceDelta: 2_000_000, swatch: swatchImg("/images/shop/swatch-3.webp", "روکش طرح چوب") },
          { id: "beech-dark", name: "چوب راش - رنگ ونگه", priceDelta: 0, swatch: swatchImg("/images/shop/swatch-2.webp", "ونگه") },
          { id: "oak-natural", name: "چوب بلوط - طبیعی", priceDelta: 5_000_000, swatch: swatchImg("/images/shop/swatch-3.webp", "بلوط") },
          { id: "walnut-solid", name: "چوب گردو - طبیعی", priceDelta: 9_000_000, swatch: swatchImg("/images/shop/swatch-1.webp", "گردو") },
          { id: "ash-light", name: "چوب ون - روشن", priceDelta: 3_000_000, swatch: swatchImg("/images/shop/swatch-3.webp", "ون") },
          { id: "maple", name: "چوب افرا", priceDelta: 4_000_000, swatch: swatchImg("/images/shop/swatch-2.webp", "افرا") },
          { id: "elm", name: "چوب نارون", priceDelta: 2_500_000, swatch: swatchImg("/images/shop/swatch-1.webp", "نارون") },
        ],
      },
      {
        key: "fabric",
        label: "رنگ پارچه",
        pickerTitle: "رنگ پارچه",
        kind: "swatch",
        options: [
          { id: "velvet-blue", name: "پارچه مخمل - رنگ آبی سایرن", priceDelta: 0, swatch: swatchImg("/images/shop/swatch-fabric-blue.webp", "آبی سایرن") },
          { id: "linen-cream", name: "پارچه جو دون - رنگ کرم", priceDelta: 0, swatch: swatchImg("/images/shop/swatch-3.webp", "کرم") },
          { id: "velvet-green", name: "پارچه مخمل - رنگ سبز", priceDelta: 1_500_000, swatch: swatchImg("/images/shop/swatch-2.webp", "سبز") },
          { id: "velvet-grey", name: "پارچه مخمل - رنگ طوسی", priceDelta: 1_500_000, swatch: swatchImg("/images/shop/swatch-2.webp", "طوسی") },
          { id: "boucle", name: "پارچه بوکله - سفید", priceDelta: 3_000_000, swatch: swatchImg("/images/shop/swatch-3.webp", "بوکله") },
          { id: "leather", name: "چرم طبیعی - قهوه‌ای", priceDelta: 12_000_000, swatch: swatchImg("/images/shop/swatch-1.webp", "چرم") },
          { id: "chenille", name: "پارچه شنیل - کرم", priceDelta: 1_000_000, swatch: swatchImg("/images/shop/swatch-3.webp", "شنیل") },
          { id: "cotton", name: "پارچه کتان - خاکستری", priceDelta: 500_000, swatch: swatchImg("/images/shop/swatch-2.webp", "کتان") },
        ],
      },
    ],
    features: [
      { text: "مونتاژ آسان با دفترچه راهنما مرحله به مرحله", icon: { src: "/images/product/icon-assembly.svg", width: 24, height: 24, alt: "" } },
      { text: "ساخته شده تمام از چوب و بدون صدا", icon: { src: "/images/product/icon-wood.svg", width: 24, height: 24, alt: "" } },
    ],
    specs: [
      { label: "بدون صدا", value: true },
      { label: "امکان سفارشی سازی", value: true },
      { label: "ضربه گیر پایه", value: false },
      { label: "وزن", value: "135g" },
      { label: "ارتفاع تاج", value: "۱۰۰ cm" },
      { label: "طول", value: "۲۲۰ cm" },
      { label: "عرض", value: "۱۶۰ cm" },
      { label: "ارتفاع تشک‌خور", value: "۳۵ cm" },
      { label: "حداکثر وزن قابل تحمل", value: "۳۰۰ kg" },
      { label: "گارانتی", value: "۵ سال" },
    ],
    specsVisible: 7,
    space: {
      rows: [
        { label: "کل فضای اشغالی", value: "۱۶ m²" },
        { label: "کل فضای مورد نیاز استاندارد", value: "۲۰ m²" },
        { label: "فاصله از هر سمت (استاندارد حداقلی)", value: "۱۵ cm" },
      ],
      diagram: { src: "/images/product/bed-diagram.svg", width: 153, height: 190, alt: "نقشه ابعاد تخت از بالا" },
      width: "۱۸۰ cm",
      depth: "۲۰۰ cm",
    },
    descriptionHtml: `
<p>تخت خواب مدرن و اسپرت دو نفره همدم؛ تلفیق کیفیت، زیبایی و آرامش</p>
<p>تخت خواب همدم با فریم تمام چوب راش، انتخابی عالی برای آن‌هایی است که هم دوام بالا و هم زیبایی طبیعی چوب را می‌خواهند.</p>
<p>طراحی تاج عقب با چیدمان ردیفی الوار چوب، جلوه‌ای خاص و منحصربه‌فرد به تخت می‌بخشد؛ به‌ویژه برای فضاهایی که پشت تخت قابل مشاهده است، این ویژگی بسیار کاربردی و چشم‌نواز خواهد بود.</p>
<p>پوشش نهایی این مدل، با روغن‌های گیاهی انجام شده تا بافت طبیعی چوب نمایان شود و علاوه بر زیبایی، حس سلامتی و آرامش را به خواب شبانه شما بیاورد.</p>
<p><br></p>
<p>ویژگی‌های برجسته تخت خواب همدم</p>
<ul>
<li>ساختار تمام چوب راش مرغوب</li>
<li>تاج عقب با الوار چوبی چیده شده به صورت ردیفی</li>
<li>مناسب فضاهایی که پشت تخت دیده می‌شود</li>
<li>پوشش روغن گیاهی برای نمایش بافت طبیعی چوب</li>
<li>تفاوت‌های یکتا در رنگ و طرح هر قطعه چوب</li>
<li>کف چوبی مقاوم و بادوام</li>
</ul>
<p>سرویس کامل تخت خواب همدم</p>
<p>برای هماهنگی کامل، <a href="/product/hamdam-nightstand">پاتختی همدم</a> می‌تواند همراه تخت سفارش داده شود و سرویس خواب شما را به مجموعه‌ای کامل و یکپارچه تبدیل کند.</p>
<p>مزایای خرید تخت خواب همدم از ماسو</p>
<ol>
<li>کیفیت و دوام بالا با چوب مرغوب راش</li>
<li>طراحی خاص تاج عقب با چیدمان الوار</li>
<li>بهینه برای دکورهای باز و مدرن</li>
<li>پوشش گیاهی سازگار با محیط و بدن</li>
<li>کف چوبی مقاوم و مونتاژ آسان</li>
</ol>
<p>راهنمای خرید</p>
<p>انتخاب سایز مناسب</p>
<p>با عرض تشک + 8 سانتی‌متر، تخت همدم برای تشک‌های استاندارد طراحی شده و فضای مناسب برای نصب فراهم می‌کند.</p>
<p>هماهنگی سبک و رنگ</p>
<p>پوشش رنگ طبیعی این مدل با اکثر سبک‌های دکوراسیون، از مینیمال تا کلاسیک، هماهنگ می‌شود.</p>
<p>نظر به شرایط اتاق</p>
<p>اگر پشت تختتان دیده می‌شود، طراحی ظریف تاج عقب این مدل، انتخابی ایده‌آل خواهد بود.</p>
<p>مزایای خرید تخت خواب همدم از سایت ماسو</p>
<ol>
<li>سفارشی‌سازی کامل در رنگ، پارچه و ابعاد</li>
<li>استفاده از چوب طبیعی و مرغوب راش</li>
<li>طراحی مطابق استانداردهای روز اروپا</li>
<li>تولید داخلی با کیفیت بالا و قیمت رقابتی</li>
<li>گارانتی کیفیت و دوام محصول</li>
</ol>`,
    faqs: [
      { question: "سوالات متداول ۱", answer: "پاسخ این سوال از وردپرس خوانده می‌شود." },
      { question: "سوالات متداول ۲", answer: "پاسخ این سوال از وردپرس خوانده می‌شود." },
      { question: "سوالات متداول ۳", answer: "پاسخ این سوال از وردپرس خوانده می‌شود." },
      { question: "سوالات متداول ۴", answer: "پاسخ این سوال از وردپرس خوانده می‌شود." },
    ],
    test: {
      price: 1_500_000,
      notice: "در صورت سفارش این محصول، مبلغ تست پرداخت شده برای حداکثر ۳ محصول تست از هزینه کل سفارش کم خواهد شد.",
      intro: [
        "تست محصول یک قطعه ۳۰x۳۰ سانتی‌متری است که جنس انتخابی محصول برای شما ارسال می‌شود تا بتوانید کیفیت و ظاهر آن را در فضای خانه خود ببینید و با اطمینان سفارش دهید.",
        "مثلاً اگر رنگ چوب و پارچه‌ای را انتخاب کنید، نتیجه تست به شکل زیر خواهد بود.",
      ],
      example: {
        wood: { id: "beech-light", name: "چوب راش - رنگ چوب روشن", swatch: swatchImg("/images/shop/swatch-3.webp", "چوب روشن") },
        fabric: { id: "linen-cream", name: "پارچه جو دون - رنگ کرم", swatch: swatchImg("/images/shop/swatch-3.webp", "کرم") },
        image: { src: "/images/product/test-sample.jpg", width: 516, height: 515, alt: "نمونه تست چوب و پارچه" },
      },
    },
  };

  /* ------------------------------------------------------------------ */
  /* Checkout (GET /maso/v1/checkout/…)                                  */
  /* ------------------------------------------------------------------ */

  const p = (id, name, cities) => ({ id, name, cities: cities.map((c, i) => ({ id: `${id}-${i + 1}`, name: c })) });

  /** Provinces with their main cities, alphabetical by Persian name */
  const provinces = [
    p("azs", "آذربایجان شرقی", ["تبریز", "مراغه", "مرند", "میانه", "اهر", "بناب", "سراب", "شبستر", "عجب‌شیر"]),
    p("azg", "آذربایجان غربی", ["ارومیه", "خوی", "مهاباد", "بوکان", "میاندوآب", "سلماس", "نقده", "پیرانشهر", "ماکو"]),
    p("ard", "اردبیل", ["اردبیل", "پارس‌آباد", "مشگین‌شهر", "خلخال", "گرمی", "نمین"]),
    p("esf", "اصفهان", ["اصفهان", "کاشان", "خمینی‌شهر", "نجف‌آباد", "شاهین‌شهر", "شهرضا", "مبارکه", "فولادشهر", "گلپایگان", "نطنز"]),
    p("alb", "البرز", ["کرج", "فردیس", "کمال‌شهر", "نظرآباد", "محمدشهر", "هشتگرد", "اشتهارد", "طالقان"]),
    p("ilm", "ایلام", ["ایلام", "دهلران", "ایوان", "آبدانان", "دره‌شهر", "مهران"]),
    p("bsh", "بوشهر", ["بوشهر", "برازجان", "گناوه", "کنگان", "خورموج", "جم", "عسلویه"]),
    p("thr", "تهران", ["تهران", "اسلام‌شهر", "پاکدشت", "پردیس", "دماوند", "رباط‌کریم", "شمیرانات", "شهریار", "فیروزکوه", "قرچک", "ملارد", "ورامین", "بهارستان", "قدس", "پیشوا"]),
    p("chb", "چهارمحال و بختیاری", ["شهرکرد", "بروجن", "فارسان", "لردگان", "فرخ‌شهر"]),
    p("khj", "خراسان جنوبی", ["بیرجند", "قائن", "فردوس", "طبس", "نهبندان"]),
    p("khr", "خراسان رضوی", ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "قوچان", "کاشمر", "تربت جام", "گناباد", "چناران"]),
    p("khs", "خراسان شمالی", ["بجنورد", "شیروان", "اسفراین", "جاجرم", "آشخانه"]),
    p("khz", "خوزستان", ["اهواز", "دزفول", "آبادان", "خرمشهر", "اندیمشک", "ماهشهر", "بهبهان", "شوشتر", "ایذه", "مسجدسلیمان"]),
    p("znj", "زنجان", ["زنجان", "ابهر", "خرمدره", "قیدار", "طارم"]),
    p("smn", "سمنان", ["سمنان", "شاهرود", "دامغان", "گرمسار", "مهدی‌شهر"]),
    p("sbl", "سیستان و بلوچستان", ["زاهدان", "چابهار", "زابل", "ایرانشهر", "سراوان", "خاش"]),
    p("frs", "فارس", ["شیراز", "مرودشت", "جهرم", "فسا", "کازرون", "لار", "داراب", "آباده", "فیروزآباد"]),
    p("qzv", "قزوین", ["قزوین", "تاکستان", "الوند", "بوئین‌زهرا", "آبیک"]),
    p("qom", "قم", ["قم", "جعفریه", "کهک"]),
    p("krd", "کردستان", ["سنندج", "سقز", "مریوان", "بانه", "بیجار", "قروه"]),
    p("krm", "کرمان", ["کرمان", "سیرجان", "رفسنجان", "جیرفت", "بم", "زرند", "شهربابک"]),
    p("krs", "کرمانشاه", ["کرمانشاه", "اسلام‌آباد غرب", "کنگاور", "هرسین", "سنقر", "جوانرود"]),
    p("khb", "کهگیلویه و بویراحمد", ["یاسوج", "دوگنبدان", "دهدشت", "لیکک"]),
    p("gls", "گلستان", ["گرگان", "گنبد کاووس", "علی‌آباد کتول", "آق‌قلا", "کردکوی", "بندر ترکمن"]),
    p("gil", "گیلان", ["رشت", "بندر انزلی", "لاهیجان", "لنگرود", "تالش", "آستارا", "رودسر", "صومعه‌سرا", "فومن", "آستانه اشرفیه"]),
    p("lrs", "لرستان", ["خرم‌آباد", "بروجرد", "دورود", "کوهدشت", "الیگودرز", "ازنا"]),
    p("mzn", "مازندران", ["ساری", "بابل", "آمل", "قائم‌شهر", "بهشهر", "چالوس", "نوشهر", "تنکابن", "رامسر", "بابلسر"]),
    p("mrk", "مرکزی", ["اراک", "ساوه", "خمین", "محلات", "دلیجان", "شازند"]),
    p("hrm", "هرمزگان", ["بندرعباس", "قشم", "کیش", "میناب", "بندر لنگه", "حاجی‌آباد"]),
    p("hmd", "همدان", ["همدان", "ملایر", "نهاوند", "اسدآباد", "تویسرکان", "کبودرآهنگ"]),
    p("yzd", "یزد", ["یزد", "میبد", "اردکان", "بافق", "مهریز", "ابرکوه"]),
  ];

  /** Cities served by Maso's own delivery & installation team: Tehran and Karaj (other cities: freight) */
  const serviceCities = ["thr-1", "alb-1"];

  const shippingMethods = {
    maso: {
      id: "maso",
      title: "سرویس ویژه ماسو",
      description: "تحویل توسط سفیر ما در محل شما",
      notice: "پس از نهایی سازی سفارش، تمامی مراحل ارسال و نصب توسط کارشناسان ما با شما هماهنگ خواهد شد.",
      branded: true,
    },
    freight: {
      id: "freight",
      title: "ارسال با باربری / قطار",
      description: "تحویل توسط شما در باربری مقصد",
      notice:
        "شهرهای که انبار توشه قطار دارند، به علت سرعت و اطمینان در به سلامت کالای شما، اولویت ارسال با قطار می باشد.\nزمانی که محصول شما به انبار برسد برای ارسال یا تحویل با شما تماس خواهند گرفت.",
    },
  };

  const paymentMethods = [
    {
      id: "online",
      title: "پرداخت اینترنتی",
      description: "در پرداخت سداد",
      icon: "card",
      logo: { src: "/images/checkout/bank-melli.png", width: 48, height: 48, alt: "بانک ملی" },
    },
    { id: "split", title: "پرداخت دو مرحله‌ای", description: "۵۰٪ الان و ۵۰٪ پس از تحویل", icon: "split" },
    { id: "cheque", title: "پرداخت با چک", description: "ثبت چک صیادی و نهایی‌سازی از طریق واتساپ", icon: "cheque" },
    {
      id: "installments",
      title: "پرداخت ۴ قسطه",
      description: "هر قسط",
      icon: "installments",
      installments: 4,
      logo: { src: "/images/checkout/installments.svg", width: 48, height: 31, alt: "پرداخت اقساطی" },
    },
  ];

  /** Demo coupon codes (code → percent). "FAIL" makes the sample payment fail. */
  const coupons = { MASO10: 10, WELCOME: 5 };

  /* ------------------------------------------------------------------ */
  /* Custom order (GET /maso/v1/custom-order)                            */
  /* ------------------------------------------------------------------ */

  const pair = {
    before: { src: "/images/custom/before-1.webp", width: 146, height: 195, alt: "طرح ارسالی مشتری" },
    after: { src: "/images/custom/after-1.webp", width: 146, height: 195, alt: "مبل ساخته شده توسط ماسو" },
  };

  /* ------------------------------------------------------------------ */
  /* Blog (GET /maso/v1/blog/posts, /maso/v1/blog/posts/{slug})          */
  /* ------------------------------------------------------------------ */

  const LOREM =
    "لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد، کتابهای زیادی در شصت و سه درصد گذشته حال و آینده، شناخت فراوان جامعه و متخصصان را می طلبد، تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه ای علی الخصوص طراحان خلاقی، و فرهنگ پیشرو در زبان فارسی ایجاد کرد، در این صورت می توان امید داشت که تمام و دشواری موجود در ارائه راهکارها، و شرایط سخت تایپ به پایان رسد و زمان مورد نیاز شامل حروفچینی دستاوردهای اصلی، و جوابگوی سوالات پیوسته اهل دنیای موجود طراحی اساسا مورد استفاده قرار گیرد.";

  /** PostSummary — what lists and cards need */
  const posts = Array.from({ length: 9 }, (_, i) => ({
    slug: i === 0 ? "minimal-furniture-arrangement" : `minimal-home-tips-${i + 1}`,
    title: "چند نکته ساده برای چیدمان مینیمال خانه‌تان",
    excerpt:
      "لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است ...",
    // ۱۴۰۵/۰۵/۰۵ and earlier
    date: new Date(Date.UTC(2026, 6, 27 - i * 6, 8)).toISOString(),
    image: { src: "/images/blog/minimal-card.jpg", width: 334, height: 336, alt: "" },
  }));

  /**
   * Body of a post: HTML from the WordPress editor. `<!--products-->` marks
   * where the "محصولات پیشنهادی" band goes (otherwise it follows the text).
   */
  const figure = `<figure><img src="assets/images/blog/minimal-wide.jpg" width="898" height="355" alt="پذیرایی مینیمال با مبل طوسی و میز ناهارخوری چوبی" loading="lazy" decoding="async" /></figure>`;
  const postContent = {
    heroImage: { src: "/images/blog/minimal-hero.jpg", width: 1440, height: 404, alt: "" },
    content: [
      `<p>${LOREM}</p>`,
      figure,
      `<h2>چند نکته ساده برای چیدمان مینیمال خانه‌تان</h2>`,
      `<p>${LOREM}</p>`,
      `<!--products-->`,
      figure,
      `<h2>چند نکته ساده برای چیدمان مینیمال خانه‌تان</h2>`,
      `<p>${LOREM}</p>`,
    ].join(""),
  };

  /* ------------------------------------------------------------------ */
  /* Account (GET /maso/v1/account, …/orders, …/addresses)               */
  /* ------------------------------------------------------------------ */

  const orderImage = { src: "/images/shop/product-izo.jpg", width: 644, height: 600, alt: "مبدل ایزو" };
  const delivery = (days) => ({ caption: "تحویل محصول", label: `${days} کاری روز دیگر`, tone: "warning" });

  /** OrderSummary — list rows and the "سفارش جاری" card */
  const orders = [
    { id: "40021", number: "12342341234", status: "pre", total: 1_480_000_000, image: orderImage, badge: { label: "در انتظار تایید شما", tone: "warning" } },
    { id: "40017", number: "12342341235", status: "current", total: 1_480_000_000, image: orderImage, badge: delivery("۱۰") },
    { id: "40011", number: "12342341236", status: "current", total: 2_960_000_000, image: orderImage, badge: delivery("۳") },
    { id: "39950", number: "12342341201", status: "delivered", total: 1_480_000_000, image: orderImage },
    { id: "39902", number: "12342341190", status: "delivered", total: 990_000_000, image: orderImage },
  ];

  /** Extra fields of OrderDetail (the sample uses the same ones for every order) */
  const orderItem = (n) => ({ slug: `izo-sofa-${n}`, name: "مبدل ایزو", image: orderImage, price: 1_480_000_000, regularPrice: 1_644_000_000, qty: 1 });
  const orderDetail = {
    address: "گیلان، رشت، بلوار گیلان، خ ۱۲۲",
    items: [orderItem(1), orderItem(2), orderItem(3)],
    receipt: { orderNumber: "12342341234", trackingCode: "12342341234", transactionId: "190-8748923704", date: "2026-07-27T09:02:00Z" },
  };
  const preInvoice = {
    image: { src: "/images/shop/product-izo.jpg", width: 644, height: 600, alt: "" },
    description:
      "لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد، کتابهای زیادی در شصت و سه درصد گذشته حال و آینده، شناخت فراوان جامعه و متخصصان را می طلبد.",
    customerName: "علی زارع",
    trackingCode: "12342341234",
    mobile: "09123456789",
    date: "2026-07-27T09:02:00Z",
    downloadUrl: "",
  };

  /** Saved addresses shown the first time the sample profile is opened */
  const sampleAddresses = [
    { id: "sample-1", firstName: "مهراد", lastName: "رادفر", mobile: "09123456789", provinceId: "gil", cityId: "gil-1", provinceName: "گیلان", cityName: "رشت", street: "بلوار گیلان، خ ۱۲۲", plaque: "12", postalCode: "1249871239" },
    { id: "sample-2", firstName: "مهراد", lastName: "رادفر", mobile: "09123456789", provinceId: "gls", cityId: "gls-5", provinceName: "گلستان", cityName: "کردکوی", street: "ابتدای جاده کردکوی - بندرترکمن", plaque: "4", postalCode: "4981734111" },
  ];

  window.MASO_MOCK = {
    settings,
    categories,
    products,
    facets,
    promo,
    productDetail,
    provinces,
    serviceCities,
    shippingMethods,
    paymentMethods,
    coupons,
    customOrder: { showcase: [pair, pair, pair, pair, pair] },
    posts,
    postContent,
    account: { firstName: "مهراد", lastName: "رادفر", email: "" },
    orders,
    orderDetail,
    preInvoice,
    sampleAddresses,
  };
})();
