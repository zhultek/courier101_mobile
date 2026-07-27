import React from 'react';
import type { IconProps as PhosphorIconProps, IconWeight } from 'phosphor-react-native';
import { ArrowLeftIcon } from 'phosphor-react-native/src/icons/ArrowLeft';
import { ArrowRightIcon } from 'phosphor-react-native/src/icons/ArrowRight';
import { ArrowUpRightIcon } from 'phosphor-react-native/src/icons/ArrowUpRight';
import { ArrowsCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsCounterClockwise';
import { BellIcon } from 'phosphor-react-native/src/icons/Bell';
import { CalculatorIcon } from 'phosphor-react-native/src/icons/Calculator';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { ChatCircleIcon } from 'phosphor-react-native/src/icons/ChatCircle';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { CircleIcon } from 'phosphor-react-native/src/icons/Circle';
import { CoinsIcon } from 'phosphor-react-native/src/icons/Coins';
import { CopySimpleIcon } from 'phosphor-react-native/src/icons/CopySimple';
import { CloudArrowDownIcon } from 'phosphor-react-native/src/icons/CloudArrowDown';
import { CreditCardIcon } from 'phosphor-react-native/src/icons/CreditCard';
import { CurrencyDollarIcon } from 'phosphor-react-native/src/icons/CurrencyDollar';
import { EnvelopeSimpleIcon } from 'phosphor-react-native/src/icons/EnvelopeSimple';
import { EyeIcon } from 'phosphor-react-native/src/icons/Eye';
import { EyeSlashIcon } from 'phosphor-react-native/src/icons/EyeSlash';
import { FileTextIcon } from 'phosphor-react-native/src/icons/FileText';
import { GlobeHemisphereWestIcon } from 'phosphor-react-native/src/icons/GlobeHemisphereWest';
import { HashIcon } from 'phosphor-react-native/src/icons/Hash';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { IdentificationCardIcon } from 'phosphor-react-native/src/icons/IdentificationCard';
import { KeyIcon } from 'phosphor-react-native/src/icons/Key';
import { LinkSimpleIcon } from 'phosphor-react-native/src/icons/LinkSimple';
import { ListIcon } from 'phosphor-react-native/src/icons/List';
import { LockIcon } from 'phosphor-react-native/src/icons/Lock';
import { MailboxIcon } from 'phosphor-react-native/src/icons/Mailbox';
import { MapPinIcon } from 'phosphor-react-native/src/icons/MapPin';
import { MapTrifoldIcon } from 'phosphor-react-native/src/icons/MapTrifold';
import { PackageIcon } from 'phosphor-react-native/src/icons/Package';
import { PaperclipIcon } from 'phosphor-react-native/src/icons/Paperclip';
import { PencilSimpleLineIcon } from 'phosphor-react-native/src/icons/PencilSimpleLine';
import { PercentIcon } from 'phosphor-react-native/src/icons/Percent';
import { PhoneIcon } from 'phosphor-react-native/src/icons/Phone';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { ShoppingBagIcon } from 'phosphor-react-native/src/icons/ShoppingBag';
import { SignOutIcon } from 'phosphor-react-native/src/icons/SignOut';
import { StackIcon } from 'phosphor-react-native/src/icons/Stack';
import { TagIcon } from 'phosphor-react-native/src/icons/Tag';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { TrayIcon } from 'phosphor-react-native/src/icons/Tray';
import { TruckIcon } from 'phosphor-react-native/src/icons/Truck';
import { UserIcon } from 'phosphor-react-native/src/icons/User';
import { UserCircleIcon } from 'phosphor-react-native/src/icons/UserCircle';
import { UsersIcon } from 'phosphor-react-native/src/icons/Users';
import { UsersThreeIcon } from 'phosphor-react-native/src/icons/UsersThree';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { XIcon } from 'phosphor-react-native/src/icons/X';

// Names keep the old Feather vocabulary so call sites read the same; each maps
// to its closest Phosphor glyph.
const GLYPHS = {
  'alert-circle': WarningCircleIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-right': ArrowRightIcon,
  'arrow-up-right': ArrowUpRightIcon,
  bell: BellIcon,
  calculator: CalculatorIcon,
  calendar: CalendarBlankIcon,
  check: CheckIcon,
  'check-circle': CheckCircleIcon,
  circle: CircleIcon,
  coins: CoinsIcon,
  copy: CopySimpleIcon,
  'chevron-down': CaretDownIcon,
  'chevron-right': CaretRightIcon,
  'credit-card': CreditCardIcon,
  'dollar-sign': CurrencyDollarIcon,
  'download-cloud': CloudArrowDownIcon,
  'edit-3': PencilSimpleLineIcon,
  eye: EyeIcon,
  'eye-off': EyeSlashIcon,
  'file-text': FileTextIcon,
  globe: GlobeHemisphereWestIcon,
  hash: HashIcon,
  home: HouseIcon,
  'id-card': IdentificationCardIcon,
  inbox: TrayIcon,
  key: KeyIcon,
  layers: StackIcon,
  link: LinkSimpleIcon,
  lock: LockIcon,
  'log-out': SignOutIcon,
  mail: EnvelopeSimpleIcon,
  mailbox: MailboxIcon,
  map: MapTrifoldIcon,
  'map-pin': MapPinIcon,
  menu: ListIcon,
  'message-square': ChatCircleIcon,
  package: PackageIcon,
  paperclip: PaperclipIcon,
  percent: PercentIcon,
  phone: PhoneIcon,
  plus: PlusIcon,
  'refresh-ccw': ArrowsCounterClockwiseIcon,
  'shopping-bag': ShoppingBagIcon,
  tag: TagIcon,
  'trash-2': TrashIcon,
  truck: TruckIcon,
  user: UserIcon,
  'user-circle': UserCircleIcon,
  users: UsersIcon,
  'users-three': UsersThreeIcon,
  x: XIcon,
} as const;

export type IconName = keyof typeof GLYPHS;

// Stroke-only glyphs have no fill areas, so duotone adds nothing; render them
// bold to match the ~2px stroke everything else here is drawn at.
const STROKE_ONLY = new Set<IconName>([
  'arrow-left',
  'arrow-right',
  'arrow-up-right',
  'check',
  'chevron-down',
  'chevron-right',
  'circle',
  'hash',
  'menu',
  'plus',
  'refresh-ccw',
  'x',
]);

export interface IconProps extends Omit<PhosphorIconProps, 'name'> {
  name: IconName;
  weight?: IconWeight;
}

export function Icon({ name, weight, ...rest }: IconProps) {
  const Glyph = GLYPHS[name];
  const resolved: IconWeight = weight ?? (STROKE_ONLY.has(name) ? 'bold' : 'duotone');
  return <Glyph weight={resolved} {...rest} />;
}
