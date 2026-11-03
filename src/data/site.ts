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
  { href: '/uchnyam/rozklad/', label: 'Розклад' },
  { href: '/uchnyam/', label: 'Учням' },
  { href: '/batkam/', label: 'Батькам' },
  { href: '/novyny/', label: 'Новини' },
  { href: '/oholoshennia/', label: 'Оголошення' },
  { href: '/dokumenty/', label: 'Документи' },
] as const;

export const officialLinks = {
  admissionRules: 'https://www.hrybovychi-school.com.ua/інформаційна-відкритість/правила-прийому-до-закладу',
} as const;
