export const site = {
  name: 'Великогрибовицький ліцей',
  fullName: 'Великогрибовицький ліцей Львівської міської ради',
  description: 'Офіційний сайт Великогрибовицького ліцею Львівської міської ради',
  address: 'с. Великі Грибовичі, вул. Стуса, 1а',
  phone: '+380 97 813 88 27',
  phoneHref: 'tel:+380978138827',
} as const;

export const navigation = [
  { href: '/pro-litsei/', label: 'Про ліцей' },
  { href: '/uchnyam/', label: 'Учням', children: [
    { href: '/uchnyam/rozklad/?view=lessons', label: 'Розклад уроків' },
    { href: '/uchnyam/rozklad/?view=bells', label: 'Розклад дзвінків' },
    { href: '/dokumenty/?category=Освітній процес', label: 'Освітні програми' },
  ] },
  { href: '/batkam/', label: 'Батькам', children: [
    { href: '/batkam/#zarahuvannia', label: 'Зарахування' },
    { href: '/batkam/#orhanizatsiia-navchannia', label: 'Організація навчання' },
    { href: '/kontakty/', label: 'Контакти' },
  ] },
  { label: 'Життя ліцею', children: [
    { href: '/novyny/', label: 'Новини' },
    { href: '/oholoshennia/', label: 'Оголошення' },
    { href: '/halerei/', label: 'Фотогалереї' },
  ] },
  { href: '/dokumenty/', label: 'Документи' },
] as const;

export const officialLinks = {
  admissionRules: 'https://www.hrybovychi-school.com.ua/інформаційна-відкритість/правила-прийому-до-закладу',
} as const;

export const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=100063934453544', icon: 'facebook' },
  { label: 'Instagram', href: 'https://www.instagram.com/lyceum_life_hrybovychi', icon: 'instagram' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@v.hrybovychi.lyceum', icon: 'tiktok' },
] as const;
