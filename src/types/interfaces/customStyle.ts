export interface CustomStyles {
  theme: Theme;
  OtpPage: OtpPage;
  CardInfoPattern: CardInfoPattern;
  CardPattern: CardPattern;
  TermsConditionsPattern: TermsConditionsPattern;
  PaymentButtonPattern: PaymentButtonPattern;
  UserCardPattern: UserCardPattern;
}

interface UserCardPattern {
  translations: Translations2;
}

interface Translations2 {
  es: Es2;
}

interface Es2 {
  addNewCard: AddNewCard;
  moreOptions: MoreOptions;
  paymentMethods: PaymentMethods;
}

interface PaymentMethods {
  seeAllMyCards: string;
  expiredCard: string;
  warningExpiredCard: string;
  confirmDeleteMethodTitle: string;
  deleteMainText: string;
  confirmDeleteMethodAccept: string;
  confirmDeleteMethodCancel: string;
  confirmDeleteMethod: string;
}

interface MoreOptions {
  payWith: string;
}

interface AddNewCard {
  info: string;
}

interface PaymentButtonPattern {
  label: string;
  hidePoweredBy: boolean;
  showOrderTotal: boolean;
  styles: Styles;
}

interface Styles {
  padding: string;
  borderRadius: string;
}

interface TermsConditionsPattern {
  showForGuest: boolean;
  showForAuth: boolean;
  legalMessage: string;
  connectorText: string;
  hideCompanyDisclaimer: boolean;
}

interface CardPattern {
  translations: Translations;
}

interface Translations {
  es: Es;
}

interface Es {
  inputs: Inputs;
}

interface Inputs {
  identityNumber: IdentityNumber;
  identityDocument: IdentityDocument;
  cardNumber: IdentityNumber;
  cardHolder: IdentityNumber;
  installment: Installment;
}

interface Installment {
  label: string;
  withoutInstallments: string;
}

interface IdentityDocument {
  label: Label;
}

interface Label {
  CO: string;
  CL: string;
  EC: string;
  MX: string;
  BR: string;
  AR: string;
  UY: string;
}

interface IdentityNumber {
  label: string;
}

interface CardInfoPattern {
  title: string;
  subtitle: Subtitle;
}

interface Subtitle {
  content: string;
}

interface OtpPage {
  overrides: Overrides2;
}

interface Overrides2 {
  Header: Header;
  Headings: Headings;
  OtpChangeChannelButton: OtpChangeChannelButton;
  ContinueAsGuestButton: ContinueAsGuestButton;
}

interface ContinueAsGuestButton {
  props: Props5;
}

interface Props5 {
  description: string;
}

interface OtpChangeChannelButton {
  props: Props4;
}

interface Props4 {
  description: Description;
}

interface Description {
  sms: string;
  email: string;
}

interface Headings {
  props: Props3;
}

interface Props3 {
  title: string;
  description: string;
}

interface Header {
  props: Props2;
}

interface Props2 {
  overrides: Overrides;
}

interface Overrides {
  Logo: Logo;
}

interface Logo {
  props: Props;
}

interface Props {
  url: string;
}

interface Theme {
  colors: Colors;
}

interface Colors {
  primaryTextColor: string;
  backgroundSecondary: string;
  backgroundPrimary: string;
  buttonPrimaryFill: string;
  buttonPrimaryHover: string;
  buttonPrimaryText: string;
  buttonPrimaryActive: string;
}