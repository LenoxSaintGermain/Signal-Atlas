import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import { GeneratedScenario, Signal, Role, Industry } from '../types';

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 12,
  },
  signalIndex: { fontSize: 9, marginBottom: 4 },
  signalTitle: { fontSize: 14, fontFamily: 'Times-Bold' },
  quote: { fontStyle: 'italic', color: '#444', marginVertical: 6 },
  scenarioTitle: { fontSize: 16, fontFamily: 'Times-Bold', marginBottom: 8 },
  body: { fontSize: 10, lineHeight: 1.5, textAlign: 'justify' },
  outcomeRow: { flexDirection: 'row', gap: 8 },
  outcomeCard: { flex: 1, border: 1, borderColor: '#ddd', padding: 8, borderRadius: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, fontSize: 9 },
});

Font.register({
  family: 'Times-Bold',
  fonts: [{ src: 'https://fonts.cdnfonts.com/s/14445/TimesNewRomanBold.woff' }],
});

export const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const buildScenarioPdf = (
  signal: Signal,
  scenario: GeneratedScenario,
  role: Role,
  industry: Industry
) => {
  const today = new Date();
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>THIRD SIGNAL — Signal Atlas</Text>
          <Text style={{ fontSize: 10 }}>▲</Text>
        </View>
        <View style={styles.divider} />

        <Text style={styles.signalIndex}>SIGNAL {signal.index}/20</Text>
        <Text style={styles.signalTitle}>{signal.title}</Text>
        <Text style={styles.quote}>"{signal.truth}"</Text>

        <View style={styles.divider} />

        <Text style={styles.scenarioTitle}>{scenario.scenario_title}</Text>
        <Text style={styles.body}>{scenario.scenario}</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>STRATEGIC IMPLICATION</Text>
        <Text style={styles.body}>{scenario.why_it_matters}</Text>

        <View style={styles.divider} />

        <Text style={[styles.sectionLabel, { color: '#b42318' }]}>⚠ HIDDEN FAILURE MODE</Text>
        <Text style={[styles.body, { fontStyle: 'italic' }]}>"{scenario.hidden_failure_mode}"</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>OUTCOME ANCHORS</Text>
        <View style={styles.outcomeRow}>
          {scenario.outcome_anchors.slice(0, 3).map((a, idx) => (
            <View key={idx} style={styles.outcomeCard}>
              <Text style={{ fontSize: 11, fontFamily: 'Times-Bold' }}>{a.metric}</Text>
              <Text style={{ fontSize: 9, marginTop: 4 }}>
                {a.direction === 'up' ? '↑' : '↓'} {a.note}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />
        <View style={styles.footer}>
          <Text>Generated for: {role} × {industry}</Text>
          <Text>
            thirdsignal.com/atlas ·{' '}
            {today.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </Page>
    </Document>
  );

  return pdf(doc).toBlob();
};
