import { Document, Page, Text, View, Font, StyleSheet } from '@react-pdf/renderer'

Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.woff', fontWeight: 400 },
    { src: '/fonts/Roboto-Bold.woff', fontWeight: 700 },
  ],
})

const s = StyleSheet.create({
  page: { fontFamily: 'Roboto', fontSize: 11, color: '#1a1a1a', padding: '20mm 20mm 20mm 20mm', lineHeight: 1.5 },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 14 },
  h2: { fontSize: 14, fontWeight: 700, marginTop: 16, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#ddd', borderBottomStyle: 'solid' },
  h3: { fontSize: 12, fontWeight: 700, marginBottom: 4 },
  charTable: { marginBottom: 16 },
  charRow: { flexDirection: 'row', marginBottom: 3 },
  charLabel: { fontWeight: 700, width: 140 },
  charVal: { flex: 1 },
  day: { marginBottom: 12 },
  p: { marginBottom: 6 },
  li: { marginBottom: 2, paddingLeft: 10 },
  footerBlock: { marginTop: 24, padding: 12, borderWidth: 1, borderColor: '#ccc', borderStyle: 'solid', borderRadius: 4, fontSize: 10 },
  footerTitle: { fontWeight: 700, marginBottom: 10 },
  twoCol: { flexDirection: 'row', marginBottom: 12 },
  col: { flex: 1, paddingRight: 10 },
  colTitle: { fontWeight: 700, marginBottom: 3 },
  sectionTitle: { fontWeight: 700, marginBottom: 5 },
  contactsHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', borderBottomStyle: 'solid', marginBottom: 4, paddingBottom: 3 },
  contactsHeaderCell: { flex: 1, fontWeight: 700, fontSize: 9 },
  contactsRow: { flexDirection: 'row', marginBottom: 3 },
  contactsCell: { flex: 1, fontSize: 9 },
  warning: { fontWeight: 700, marginTop: 8 },
})

function stripHtml(html) {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function buildCharRows(route) {
  const rows = []

  if (route.distance != null && route.distance !== '') {
    rows.push({ label: 'Расстояние', value: `${route.distance} км` })
  }

  const seasonsDisplay = Array.isArray(route.customFilters?.seasons) && route.customFilters.seasons.length > 0
    ? route.customFilters.seasons.join(', ')
    : (route.season || '')
  if (seasonsDisplay) rows.push({ label: 'Сезон', value: seasonsDisplay })

  if (route.elevationGain != null && route.elevationGain !== '') {
    rows.push({ label: 'Перепад высот', value: `${route.elevationGain} м` })
  }

  if (route.hasOvernight) rows.push({ label: 'С ночевкой', value: 'Да' })

  if (route.difficulty != null) {
    const labels = { 1: 'лёгкий', 2: 'простой', 3: 'средний', 4: 'сложный', 5: 'очень сложный' }
    rows.push({ label: 'Сложность', value: `${route.difficulty} — ${labels[route.difficulty] || ''}` })
  }

  if (route.duration) rows.push({ label: 'Продолжительность', value: route.duration })
  if (route.isFamily) rows.push({ label: 'Семейный маршрут', value: 'Да' })

  const transportDisplay = Array.isArray(route.customFilters?.transport) && route.customFilters.transport.length > 0
    ? route.customFilters.transport.join(', ')
    : (route.transport || '')
  if (transportDisplay) rows.push({ label: 'Транспорт', value: transportDisplay })

  return rows
}

export default function RoutePDFDocument({ route }) {
  const points = Array.isArray(route.points) ? route.points : []
  const charRows = buildCharRows(route)
  const importantInfoText = stripHtml(route.importantInfo)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>{route.title || ''}</Text>

        {charRows.length > 0 && (
          <View style={s.charTable}>
            {charRows.map((row, i) => (
              <View key={i} style={s.charRow}>
                <Text style={s.charLabel}>{row.label}</Text>
                <Text style={s.charVal}>{row.value}</Text>
              </View>
            ))}
          </View>
        )}

        {points.length > 0 && (
          <View>
            <Text style={s.h2}>Описание маршрута</Text>
            {points.map((point, i) => (
              <View key={i} style={s.day}>
                <Text style={s.h3}>{point.title || `День ${i + 1}`}</Text>
                <Text style={s.p}>{stripHtml(point.description)}</Text>
              </View>
            ))}
          </View>
        )}

        {importantInfoText ? (
          <View>
            <Text style={s.h2}>Важно знать</Text>
            <Text style={s.p}>{importantInfoText}</Text>
          </View>
        ) : null}

        {/* Статический блок */}
        <View style={s.footerBlock}>
          <Text style={s.footerTitle}>
            Рекомендуем пройти консультацию перед прохождением маршрута в Туристско-информационном центре.
          </Text>

          <View style={s.twoCol}>
            <View style={s.col}>
              <Text style={s.colTitle}>ТИЦ Домбай «Katadze»</Text>
              <Text>Адрес: кп. Домбай, Карачаевская улица, 101в, 1 этаж</Text>
              <Text>Тел: +7–928–032–22–21</Text>
            </View>
            <View style={s.col}>
              <Text style={s.colTitle}>ТИЦ Архыз</Text>
              <Text>Адрес: Горная ул., 1, посёлок Романтик, село Архыз</Text>
              <Text>Тел: 8 (800) 100-55-59</Text>
            </View>
          </View>

          <Text style={s.sectionTitle}>Там вы сможете получить полную информацию по:</Text>
          {[
            'сложности маршрута;',
            'необходимости регистрации в МЧС;',
            'необходимости в пропуске на пограничную зону;',
            'подбору гидов и прокатов на месте;',
            'медицинским ограничениям для прохождения маршрутов;',
            'и др. консультации по маршрутам и турам.',
          ].map((item, i) => (
            <Text key={i} style={s.li}>• {item}</Text>
          ))}

          <Text style={[s.sectionTitle, { marginTop: 10 }]}>Телефоны экстренных служб</Text>
          <Text>Скорая помощь: 03, 103, 030</Text>
          <Text>МВД: 02, 102, 020</Text>
          <Text>МЧС: 010</Text>
          <Text style={{ marginBottom: 8 }}>Поисково-спасательный отряд: +7 (8782) 23-90-60</Text>

          <View style={s.contactsHeader}>
            <Text style={s.contactsHeaderCell}>Архыз</Text>
            <Text style={s.contactsHeaderCell}>Домбай</Text>
            <Text style={s.contactsHeaderCell}>Теберда</Text>
          </View>
          {[
            ['Медпункт +7 (938) 038-94-49', 'Медпункт +7 (87872) 58-26-33', 'Медпункт +7 (87879) 5-27-68'],
            ['МВД +7 (999) 490-33-24', 'МВД +7 (999) 490-33-74', 'МВД +7 (999) 490-33-95'],
            ['МЧС +7 (928) 398-37-11', 'МЧС +7 (87872) 58-138', 'МЧС +7 (87879) 5-27-72'],
            ['ПСП +7 (928) 396-47-87', 'ПСП Мусса-Ачитар +7 (928) 028-64-63', 'ПСП +7 (87879) 5-81-38'],
          ].map((row, i) => (
            <View key={i} style={s.contactsRow}>
              {row.map((cell, j) => <Text key={j} style={s.contactsCell}>{cell}</Text>)}
            </View>
          ))}

          <Text style={s.warning}>
            Обязательно в случае повышенной сложности маршрута необходимо зарегистрироваться в местном отделении МЧС перед началом прохождения маршрута.
          </Text>
          <Text style={s.warning}>
            Если маршрут проходит по пограничной зоне — необходимо взять пропуск пограничную зону КЧР.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
