import { buildElementsLink } from "./buildElementsLink";
import { buildNextActionLink } from "./buildNextActionLink";
import { buildPaymentLink } from "./buildPaymentLink";
import { buildVoucherLink } from "./buildVoucherLink";

export const linkBuilders = {
  elements: buildElementsLink,
  payment: buildPaymentLink,
  nextAction: buildNextActionLink,
  voucher: buildVoucherLink,
};
