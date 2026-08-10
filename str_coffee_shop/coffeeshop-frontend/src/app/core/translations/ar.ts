export const AR_TRANSLATIONS: Record<string, any> = {
  common: {
    appName: "بلاك بير كافيه",
    tagline: "مقهى ومشروبات",
    logout: "تسجيل الخروج",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    add: "إضافة",
    actions: "الإجراءات",
    status: "الحالة",
    date: "التاريخ",
    time: "الوقت",
    total: "الإجمالي",
    price: "السعر",
    quantity: "الكمية",
    search: "بحث...",
    filter: "تصفية",
    all: "الكل",
    loading: "جاري التحميل...",
    noData: "لا توجد بيانات متاحة",
    error: "حدث خطأ ما",
    close: "إغلاق",
    confirm: "تأكيد",
    back: "رجوع",
    details: "التفاصيل",
    cash: "نقداً",
    card: "بطاقة بنكية",
    tpe: "جهاز البطاقة TPE",
    currency: "دينار تونسي"
  },
  auth: {
    loginTitle: "مرحباً بك",
    loginSubtitle: "تسجيل الدخول إلى مقهى بلاك بير",
    usernameLabel: "اسم المستخدم",
    usernamePlaceholder: "أدخل اسم المستخدم",
    passwordLabel: "كلمة المرور",
    passwordPlaceholder: "أدخل كلمة المرور",
    loginButton: "تسجيل الدخول",
    loggingIn: "جاري تسجيل الدخول...",
    loginError: "اسم المستخدم أو كلمة المرور غير صحيحة"
  },
  nav: {
    dashboard: "لوحة التحكم",
    orders: "الطلبات",
    pos: "نقطة البيع POS",
    activeOrders: "الطلبات النشطة",
    newOrder: "طلب جديد",
    qrOrders: "طلبات رمز QR",
    menu: "قائمة الطعام",
    categories: "الفئات",
    workers: "الموظفون",
    tables: "الطاولات",
    reports: "التقارير",
    shiftReports: "تقارير الورديات",
    availability: "توفر القائمة"
  },
  admin: {
    dashboard: {
      title: "لوحة تحكم المدير",
      welcome: "نظرة عامة على أداء اليوم ونشاط المقهى.",
      todaySales: "مبيعات اليوم",
      ordersToday: "طلبات اليوم",
      activeWorkers: "الموظفون النشطون",
      tablesOccupied: "الطاولات المشغولة",
      recentOrders: "أحدث الطلبات",
      orderId: "طلب رقم #",
      type: "النوع",
      items: "العناصر",
      amount: "المبلغ",
      status: "الحالة",
      viewAllOrders: "عرض جميع الطلبات"
    },
    menu: {
      title: "إدارة القائمة",
      addItem: "إضافة صنف جديد",
      editItem: "تعديل الصنف",
      name: "اسم الصنف",
      category: "الفئة",
      price: "السعر (دينار تونسي)",
      available: "متوفر",
      unavailable: "غير متوفر",
      image: "رابط الصورة",
      description: "الوصف",
      deleteConfirm: "هل أنت تأكد من أنك تريد حذف هذا الصنف من القائمة؟"
    },
    orders: {
      title: "سجل الطلبات",
      filterStatus: "تصفية حسب الحالة",
      filterType: "تصفية حسب النوع",
      allStatuses: "جميع الحالات",
      allTypes: "جميع الأنواع",
      pending: "قيد الانتظار",
      preparing: "قيد التحضير",
      ready: "جاهز",
      completed: "مكتمل",
      cancelled: "ملغى"
    },
    workers: {
      title: "إدارة الموظفين",
      addWorker: "إضافة موظف",
      editWorker: "تعديل الموظف",
      username: "اسم المستخدم",
      fullName: "الاسم الكامل",
      role: "الدور",
      workerRole: "موظف",
      adminRole: "مدير",
      deleteConfirm: "هل أنت تأكد من حذف هذا الموظف؟"
    },
    categories: {
      title: "إدارة الفئات",
      addCategory: "إضافة فئة",
      categoryName: "اسم الفئة",
      deleteConfirm: "هل أنت تأكد من حذف هذه الفئة؟"
    },
    tables: {
      title: "إدارة الطاولات",
      addTable: "إضافة طاولة",
      tableNumber: "رقم الطاولة",
      capacity: "عدد المقاعد",
      qrCode: "رمز QR",
      viewQr: "عرض رمز QR"
    },
    reports: {
      title: "التحليلات والتقارير",
      totalRevenue: "إجمالي الإيرادات",
      totalOrdersCount: "إجمالي الطلبات",
      avgOrderValue: "متوسط قيمة الطلب",
      topSelling: "الأكثر مبيعاً"
    },
    shiftReports: {
      title: "تقارير الورديات",
      worker: "الموظف",
      checkIn: "بدء وردية",
      checkOut: "إنهاء وردية",
      ordersHandled: "الطلبات المعالجة",
      totalSales: "إجمالي المبيعات",
      ongoing: "مستمرة"
    }
  },
  worker: {
    header: {
      shiftActive: "الوردية نشطة",
      shiftInactive: "الوردية متوقفة",
      checkIn: "تسجيل دخول الوردية",
      checkOut: "تسجيل خروج الوردية",
      checking: "جاري التحديث..."
    },
    dashboard: {
      title: "لوحة الموظف",
      welcome: "مرحباً بك!",
      quickPos: "فتح نقطة البيع / طلب جديد",
      viewActive: "عرض الطلبات النشطة",
      viewQr: "عرض طلبات QR",
      activeShiftPrompt: "يرجى تسجيل بدء الوردية للبدء في استقبال الطلبات."
    },
    pos: {
      title: "طلب جديد (نقطة البيع)",
      selectItems: "اختر الأصناف",
      orderSummary: "ملخص الطلب",
      tableSelect: "رقم الطاولة",
      takeaway: "سفري",
      dineIn: "محلي",
      emptyCart: "لم يتم اختيار أي أصناف بعد.",
      paymentMethod: "طريقة الدفع",
      placeOrder: "تأكيد الطلب",
      processing: "جاري المعالجة...",
      orderSuccess: "تم تسجيل الطلب بنجاح!",
      receipt: "الفاتورة",
      printReceipt: "طباعة الفاتورة"
    },
    activeOrders: {
      title: "الطلبات النشطة",
      markPreparing: "بدء التحضير",
      markReady: "جاهز للتقديم",
      markCompleted: "إتمام الطلب",
      cancelOrder: "إلغاء"
    },
    qrOrders: {
      title: "طلبات QR في الانتظار",
      table: "طاولة",
      accept: "قبول وتحضير",
      reject: "رفض الطلب",
      noPending: "لا توجد طلبات QR معلقة حالياً."
    },
    tables: {
      title: "نظرة عامة على الطاولات",
      vacant: "شاغرة",
      occupied: "مشغولة",
      reserved: "محجوزة"
    },
    menu: {
      title: "إدارة توفر الأصناف",
      toggleNotice: "تفعيل أو تعطيل توفر الأصناف مباشرة لطلبات الزبائن."
    }
  },
  customer: {
    welcome: "مرحباً بكم في بلاك بير كافيه",
    table: "طاولة رقم",
    invalidTable: "رمز QR هذا غير صالح.",
    unavailableTable: "هذه الطاولة غير متاحة حالياً. يرجى طلب المساعدة من الطاقم.",
    searchPlaceholder: "ابحث عن قهوة، حلويات...",
    allCategories: "الكل",
    cartTitle: "طلبك",
    cartEmpty: "سلة الطلبات فارغة. أضف بعض المنتجات من القائمة!",
    itemTotal: "عدد العناصر",
    placeOrder: "إرسال الطلب",
    sending: "جاري إرسال الطلب...",
    orderConfirmedTitle: "تم استلام طلبك!",
    orderNumber: "رقم الطلب",
    orderConfirmedMsg: "شكراً لك! يقوم الباريستا بتحضير طلبك الآن.",
    orderAnother: "طلب شيء آخر"
  }
};
