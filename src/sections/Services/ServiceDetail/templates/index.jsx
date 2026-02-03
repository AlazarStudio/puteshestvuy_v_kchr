import { DEFAULT_TEMPLATE_KEY } from '../serviceTypeTemplates'
import TemplatePlaceholder from './TemplatePlaceholder'
import GuideTemplate from './GuideTemplate'
import ActivitiesTemplate from './ActivitiesTemplate'
import EquipmentRentalTemplate from './EquipmentRentalTemplate'
import RoadsideServiceTemplate from './RoadsideServiceTemplate'
import ShopTemplate from './ShopTemplate'
import SouvenirsTemplate from './SouvenirsTemplate'
import HotelTemplate from './HotelTemplate'
import CafeTemplate from './CafeTemplate'
import TransferTemplate from './TransferTemplate'
import GasStationTemplate from './GasStationTemplate'
import ToiletsTemplate from './ToiletsTemplate'
import MedicalTemplate from './MedicalTemplate'
import PoliceTemplate from './PoliceTemplate'
import FireTemplate from './FireTemplate'
import TourOperatorTemplate from './TourOperatorTemplate'
import RoadsidePointTemplate from './RoadsidePointTemplate'

const TEMPLATE_MAP = {
  guide: GuideTemplate,
  activities: ActivitiesTemplate,
  'equipment-rental': EquipmentRentalTemplate,
  'roadside-service': RoadsideServiceTemplate,
  shop: ShopTemplate,
  souvenirs: SouvenirsTemplate,
  hotel: HotelTemplate,
  cafe: CafeTemplate,
  transfer: TransferTemplate,
  'gas-station': GasStationTemplate,
  toilets: ToiletsTemplate,
  medical: MedicalTemplate,
  police: PoliceTemplate,
  fire: FireTemplate,
  'tour-operator': TourOperatorTemplate,
  'roadside-point': RoadsidePointTemplate,
}

export const TEMPLATE_COMPONENTS = TEMPLATE_MAP
export { DEFAULT_TEMPLATE_KEY }

export function getTemplateComponent(templateKey) {
  const key = (templateKey && String(templateKey).toLowerCase().trim()) || DEFAULT_TEMPLATE_KEY
  return TEMPLATE_MAP[key] || TEMPLATE_MAP[DEFAULT_TEMPLATE_KEY]
}

/** Рендер шаблона по ключу. Ключ берётся из URL /services/template/:type */
export function ServiceTemplateByType({ type }) {
  const key = (type && String(type).toLowerCase().trim()) || DEFAULT_TEMPLATE_KEY
  const Component = TEMPLATE_MAP[key] || TEMPLATE_MAP[DEFAULT_TEMPLATE_KEY]

  switch (key) {
    case 'guide': return <GuideTemplate key="guide" />
    case 'activities': return <ActivitiesTemplate key="activities" />
    case 'equipment-rental': return <EquipmentRentalTemplate key="equipment-rental" />
    case 'roadside-service': return <RoadsideServiceTemplate key="roadside-service" />
    case 'shop': return <ShopTemplate key="shop" />
    case 'souvenirs': return <SouvenirsTemplate key="souvenirs" />
    case 'hotel': return <HotelTemplate key="hotel" />
    case 'cafe': return <CafeTemplate key="cafe" />
    case 'transfer': return <TransferTemplate key="transfer" />
    case 'gas-station': return <GasStationTemplate key="gas-station" />
    case 'toilets': return <ToiletsTemplate key="toilets" />
    case 'medical': return <MedicalTemplate key="medical" />
    case 'police': return <PoliceTemplate key="police" />
    case 'fire': return <FireTemplate key="fire" />
    case 'tour-operator': return <TourOperatorTemplate key="tour-operator" />
    case 'roadside-point': return <RoadsidePointTemplate key="roadside-point" />
    default: return <GuideTemplate key="default" />
  }
}
