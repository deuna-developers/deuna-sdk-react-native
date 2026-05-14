import React, { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import {
  IntegrationConfig,
  IntegrationEnvironment,
  WidgetType,
  PresentationMode,
} from '../../explore/domain';

interface Props {
  visible: boolean;
  draftConfig: IntegrationConfig;
  keyErrorMessage: string | null;
  fraudIdStatusMessage: string | null;
  isGeneratingFraudId: boolean;
  isApplyingConfiguration: boolean;
  onUpdateDraft: (patch: Partial<IntegrationConfig>) => void;
  onDiscard: () => void;
  onApply: (onSuccess?: () => void) => void;
  onGenerateFraudId: () => void;
}

const COLORS = {
  brandBlue: '#147AE8',
  screenBackground: '#F2F2F7',
  cardBackground: '#E5E5EA',
  labelGray: '#6E7480',
};

// ─── SegmentedPillSelector ────────────────────────────────────────────────────

function SegmentedPillSelector<T extends string>({
  items,
  labels,
  selected,
  onSelect,
}: {
  items: T[];
  labels?: string[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={pillStyles.container}>
      {items.map((item, i) => {
        const isSelected = selected === item;
        return (
          <TouchableOpacity
            key={item}
            style={[pillStyles.pill, isSelected && pillStyles.pillSelected]}
            onPress={() => onSelect(item)}
          >
            <Text
              style={[
                pillStyles.pillText,
                isSelected && pillStyles.pillTextSelected,
              ]}
            >
              {labels ? labels[i] : item}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const pillStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 4,
  },
  pill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: 'white',
  },
  pillText: {
    fontSize: 13,
    color: COLORS.labelGray,
  },
  pillTextSelected: {
    color: COLORS.brandBlue,
    fontWeight: '600',
  },
});

// ─── ClearableTextField ───────────────────────────────────────────────────────

function ClearableTextField({
  value,
  onChangeText,
  placeholder,
  multiline,
  autoCapitalize,
  keyboardType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <View style={fieldStyles.wrapper}>
      <TextInput
        style={[fieldStyles.input, multiline && fieldStyles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.labelGray}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={false}
        multiline={multiline}
        keyboardType={keyboardType}
      />
      {value.length > 0 && (
        <TouchableOpacity
          style={fieldStyles.clearBtn}
          onPress={() => onChangeText('')}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={fieldStyles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#333',
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  clearBtn: {
    padding: 8,
  },
  clearIcon: {
    fontSize: 13,
    color: COLORS.labelGray,
  },
});

// ─── Card Section ─────────────────────────────────────────────────────────────

function CardSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={cardStyles.wrapper}>
      <Text style={cardStyles.title}>{title}</Text>
      <View style={cardStyles.card}>{children}</View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.labelGray,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
});

// ─── SwitchRow ────────────────────────────────────────────────────────────────

function SwitchRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={switchRowStyles.row}>
      <Text style={switchRowStyles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: COLORS.brandBlue }}
        thumbColor="white"
      />
    </View>
  );
}

const switchRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { fontSize: 14, color: '#333', flex: 1 },
});

// ─── RadioRow ─────────────────────────────────────────────────────────────────

function RadioRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={radioStyles.row} onPress={onPress}>
      <View style={[radioStyles.outer, selected && radioStyles.outerSelected]}>
        {selected && <View style={radioStyles.inner} />}
      </View>
      <Text style={radioStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const radioStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  outer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerSelected: { borderColor: COLORS.brandBlue },
  inner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.brandBlue,
  },
  label: { fontSize: 14, color: '#333' },
});

// ─── FieldLabel ───────────────────────────────────────────────────────────────

function FieldLabel({ label }: { label: string }) {
  return (
    <Text style={{ fontSize: 12, color: COLORS.labelGray, marginBottom: 2 }}>
      {label}
    </Text>
  );
}

// ─── ConfigurationDrawer ──────────────────────────────────────────────────────

export const ConfigurationDrawer = ({
  visible,
  draftConfig,
  keyErrorMessage,
  fraudIdStatusMessage,
  isGeneratingFraudId,
  isApplyingConfiguration,
  onUpdateDraft,
  onDiscard,
  onApply,
  onGenerateFraudId,
}: Props) => {
  const handleApply = useCallback(() => {
    onApply(() => {
      // no-op; parent should close modal on success via state
    });
  }, [onApply]);

  const copyFraudId = useCallback(() => {
    if (draftConfig.fraudId) {
      Clipboard.setString(draftConfig.fraudId);
    }
  }, [draftConfig.fraudId]);

  const WIDGET_OPTIONS: { value: WidgetType; label: string }[] = [
    { value: 'payment', label: 'Payment Widget' },
    { value: 'vault', label: 'Vault Widget' },
    { value: 'next_action', label: 'Next Action' },
    { value: 'voucher', label: 'Voucher' },
    { value: 'click_to_pay', label: 'Click to Pay' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDiscard}
    >
      <SafeAreaView style={drawerStyles.root}>
        {/* Header */}
        <View style={drawerStyles.header}>
          <Text style={drawerStyles.headerTitle}>Configuration</Text>
          <TouchableOpacity
            onPress={onDiscard}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={drawerStyles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={drawerStyles.scroll}
          contentContainerStyle={drawerStyles.content}
        >
          {/* 1. Environment */}
          <CardSection title="Environment">
            <SegmentedPillSelector<IntegrationEnvironment>
              items={['sandbox', 'development', 'staging']}
              labels={['Sandbox', 'Develop', 'Staging']}
              selected={draftConfig.environment}
              onSelect={(v) => onUpdateDraft({ environment: v })}
            />
          </CardSection>

          {/* 2. Keys */}
          <CardSection title="Keys">
            <View>
              <FieldLabel label="Public Key *" />
              <ClearableTextField
                value={draftConfig.publicKey}
                onChangeText={(v) => onUpdateDraft({ publicKey: v })}
                placeholder="YOUR_PUBLIC_API_KEY"
              />
            </View>
            <View>
              <FieldLabel label="Private Key (optional)" />
              <ClearableTextField
                value={draftConfig.privateKey}
                onChangeText={(v) => onUpdateDraft({ privateKey: v })}
                placeholder="YOUR_PRIVATE_API_KEY"
              />
            </View>
            {keyErrorMessage ? (
              <Text style={drawerStyles.errorText}>{keyErrorMessage}</Text>
            ) : null}
          </CardSection>

          {/* 3. Tokens */}
          <CardSection title="Tokens">
            <View>
              <FieldLabel label="Order Token (optional)" />
              <ClearableTextField
                value={draftConfig.orderToken}
                onChangeText={(v) => onUpdateDraft({ orderToken: v })}
                placeholder="order_token"
              />
            </View>
            <View>
              <FieldLabel label="User Token (optional)" />
              <ClearableTextField
                value={draftConfig.userToken}
                onChangeText={(v) => onUpdateDraft({ userToken: v })}
                placeholder="user_token"
                multiline
              />
            </View>
          </CardSection>

          {/* 4. Widget Type */}
          <CardSection title="Widget Type">
            {WIDGET_OPTIONS.map((opt) => (
              <RadioRow
                key={opt.value}
                label={opt.label}
                selected={draftConfig.selectedWidget === opt.value}
                onPress={() => onUpdateDraft({ selectedWidget: opt.value })}
              />
            ))}
          </CardSection>

          {/* 5. Options */}
          <CardSection title="Options">
            <SwitchRow
              label="Hide Widget Pay Button"
              value={draftConfig.hidePayButton}
              onValueChange={(v) => onUpdateDraft({ hidePayButton: v })}
            />
            <SwitchRow
              label="Enable Split Payment"
              value={draftConfig.enableSplitPayment}
              onValueChange={(v) => onUpdateDraft({ enableSplitPayment: v })}
            />
            <View>
              <FieldLabel label="Presentation Mode" />
              <SegmentedPillSelector<PresentationMode>
                items={['modal', 'embedded']}
                labels={['Modal', 'Embedded']}
                selected={draftConfig.presentationMode}
                onSelect={(v) => onUpdateDraft({ presentationMode: v })}
              />
            </View>
          </CardSection>

          {/* 6. User Info */}
          <CardSection title="User Info">
            <View>
              <FieldLabel label="First Name" />
              <ClearableTextField
                value={draftConfig.userInfoFirstName}
                onChangeText={(v) => onUpdateDraft({ userInfoFirstName: v })}
                placeholder="John"
                autoCapitalize="words"
              />
            </View>
            <View>
              <FieldLabel label="Last Name" />
              <ClearableTextField
                value={draftConfig.userInfoLastName}
                onChangeText={(v) => onUpdateDraft({ userInfoLastName: v })}
                placeholder="Doe"
                autoCapitalize="words"
              />
            </View>
            <View>
              <FieldLabel label="Email" />
              <ClearableTextField
                value={draftConfig.userInfoEmail}
                onChangeText={(v) => onUpdateDraft({ userInfoEmail: v })}
                placeholder="john@example.com"
                keyboardType="email-address"
              />
            </View>
          </CardSection>

          {/* 7. Domain */}
          <CardSection title="Domain">
            <View>
              <FieldLabel label="Domain (optional)" />
              <ClearableTextField
                value={draftConfig.domain}
                onChangeText={(v) => onUpdateDraft({ domain: v })}
                placeholder="https://custom.domain.com"
                autoCapitalize="none"
              />
            </View>
          </CardSection>

          {/* 8. Fraud */}
          <CardSection title="Fraud">
            <View>
              <FieldLabel label="Fraud Providers JSON" />
              <ClearableTextField
                value={draftConfig.fraudProvidersJson}
                onChangeText={(v) => onUpdateDraft({ fraudProvidersJson: v })}
                placeholder='{"CYBERSOURCE": {...}}'
                multiline
              />
            </View>
            <View style={drawerStyles.fraudIdRow}>
              <View style={{ flex: 1 }}>
                <FieldLabel label="Fraud ID" />
                <ClearableTextField
                  value={draftConfig.fraudId}
                  onChangeText={(v) => onUpdateDraft({ fraudId: v })}
                  placeholder="Generated fraud ID"
                />
              </View>
            </View>
            <View style={drawerStyles.fraudBtnRow}>
              <TouchableOpacity
                style={drawerStyles.fraudBtn}
                onPress={onGenerateFraudId}
                disabled={isGeneratingFraudId}
              >
                {isGeneratingFraudId ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={drawerStyles.fraudBtnText}>Generar</Text>
                )}
              </TouchableOpacity>
              {draftConfig.fraudId ? (
                <TouchableOpacity
                  style={[drawerStyles.fraudBtn, drawerStyles.fraudBtnOutline]}
                  onPress={copyFraudId}
                >
                  <Text style={drawerStyles.fraudBtnOutlineText}>Copy</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {fraudIdStatusMessage ? (
              <Text style={drawerStyles.statusText}>
                {fraudIdStatusMessage}
              </Text>
            ) : null}
          </CardSection>
        </ScrollView>

        {/* Footer */}
        <View style={drawerStyles.footer}>
          <TouchableOpacity style={drawerStyles.cancelBtn} onPress={onDiscard}>
            <Text style={drawerStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={drawerStyles.applyBtn}
            onPress={handleApply}
            disabled={isApplyingConfiguration}
          >
            {isApplyingConfiguration ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={drawerStyles.applyText}>Explorar</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const drawerStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.screenBackground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '700', color: '#1B2B6E' },
  closeBtn: { fontSize: 18, color: '#888', paddingHorizontal: 4 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  errorText: { fontSize: 13, color: '#D32F2F', marginTop: 4 },
  statusText: { fontSize: 12, color: '#555', marginTop: 2 },
  fraudIdRow: { flexDirection: 'row', gap: 8 },
  fraudBtnRow: { flexDirection: 'row', gap: 8 },
  fraudBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#147AE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fraudBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
  fraudBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#147AE8',
  },
  fraudBtnOutlineText: { color: '#147AE8', fontWeight: '600', fontSize: 14 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCC',
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: '#555', fontWeight: '500' },
  applyBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#147AE8',
    alignItems: 'center',
  },
  applyText: { fontSize: 15, color: 'white', fontWeight: '700' },
});
