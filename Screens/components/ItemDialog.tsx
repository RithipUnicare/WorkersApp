import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Text, Alert, TouchableOpacity } from 'react-native';
import {
  Button,
  Dialog,
  Portal,
  TextInput,
  IconButton,
} from 'react-native-paper';
import { Dropdown } from 'react-native-element-dropdown';
import { ProjectAPI, QuotationAPI, UnitAPI } from '../../service/apiService';

export type ProjectItem = {
  id?: number;
  projectId?: number;
  itemName: string;
  itemDescription?: string;
  rateMrp: number;
  quantity: number;
  amount?: number;
  unitId: number;
  taxPercentage?: number;
  hsnSac?: string;
  totalCost?: number;
};

export type QuotationItem = {
  id?: number;
  quotationId?: number;
  itemName: string;
  itemDescription?: string;
  quantity: number;
  unitId: number;
  rateMrp: number;
  taxPercentage?: number;
  hsnSac?: string;
  totalCost?: number;
};

type Props = {
  visible: boolean;
  onDismiss: () => void;
  mode?: 'project' | 'quotation';
  projectId?: number;
  quotationId?: number;
  item?: ProjectItem | QuotationItem | null;
  onSaved: (item: any) => void;
  title?: string;
  maxHeight?: number;
  t?: (s: string) => string;
};

const ItemDialog: React.FC<Props> = ({
  visible,
  onDismiss,
  mode = 'project',
  projectId,
  quotationId,
  item,
  onSaved,
  title,
  maxHeight = 520,
  t,
}) => {
  const tr = (s: string) => (t ? t(s) : s);
  const isEdit = !!item?.id;

  const [units, setUnits] = useState<
    Array<{ id: number; name: string; shortName?: string }>
  >([]);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('');
  const [unitId, setUnitId] = useState<number | null>(null);
  const [mrp, setMrp] = useState('');
  const [tax, setTax] = useState('');
  const [hsn, setHsn] = useState('');
  const [saving, setSaving] = useState(false);
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitShortName, setNewUnitShortName] = useState('');

  useEffect(() => {
    if (visible) {
      UnitAPI.getAll()
        .then(res => {
          if (Array.isArray(res?.data)) setUnits(res.data);
        })
        .catch(() => {});
    }
  }, [visible]);

  useEffect(() => {
    if (visible && item) {
      setName(item.itemName || '');
      setDesc(item.itemDescription || '');
      setQty(String(item.quantity ?? ''));
      setUnitId((item as any).unitId ?? null);
      setMrp(String(item.rateMrp ?? ''));
      setTax(String((item as any).taxPercentage ?? ''));
      setHsn(String((item as any).hsnSac ?? ''));
    } else if (visible && !item) {
      setName('');
      setDesc('');
      setQty('');
      setUnitId(null);
      setMrp('');
      setTax('');
      setHsn('');
    }
  }, [visible, item]);

  const unitDropdown = useMemo(
    () =>
      units.map(u => ({
        label: u.shortName ? `${u.name} (${u.shortName})` : u.name,
        value: u.id,
      })),
    [units],
  );

  const canSave = name && qty && unitId && mrp;

  const calcTotal = useMemo(() => {
    const q = Number(qty) || 0;
    const m = Number(mrp) || 0;
    const tval = Number(tax) || 0;
    const sub = q * m;
    return sub + (sub * tval) / 100;
  }, [qty, mrp, tax]);

  const confirmDeleteUnit = (id: number, label: string) => {
    Alert.alert(tr('Delete Unit'), `${tr('Are you sure?')}\n${label}`, [
      { text: tr('Cancel') },
      {
        text: tr('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('Deleting unit', id);
            const res = await UnitAPI.delete(id);
            console.log('Deleted unit', res);
            setUnits(prev => prev.filter(u => u.id !== id));
            if (unitId === id) setUnitId(null);
          } catch (e) {
            console.log('Error deleting unit', e);
          }
        },
      },
    ]);
  };

  const addUnit = async () => {
    if (!newUnitName || !newUnitShortName) return;
    try {
      const res = await UnitAPI.create({
        name: newUnitName,
        shortName: newUnitShortName,
      });
      if (res?.data) {
        setUnits(prev => [...prev, res.data]);
        setUnitId(res.data.id);
      }
      setNewUnitName('');
      setNewUnitShortName('');
      setUnitModalOpen(false);
    } catch (e) {}
  };

  const doSave = async () => {
    if (!canSave) return;
    const quantity = Number(qty) || 0;
    const rateMrp = Number(mrp) || 0;
    const taxPercentage = Number(tax) || 0;

    const payload: any = {
      itemName: name,
      itemDescription: desc,
      quantity,
      rateMrp,
      unitId: unitId!,
      taxPercentage,
      hsnSac: hsn,
    };

    const confirmDeleteUnit = (id: number, label: string) => {
      Alert.alert(tr('Delete Unit'), `${tr('Are you sure?')}\n${label}`, [
        { text: tr('Cancel') },
        {
          text: tr('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await UnitAPI.delete(id);
              setUnits(prev => prev.filter(u => u.id !== id));
              if (unitId === id) setUnitId(null);
            } catch (e) {}
          },
        },
      ]);
    };

    // const addUnit = async () => {
    //   if (!newUnitName || !newUnitShortName) return;
    //   try {
    //     const res = await UnitAPI.create({
    //       name: newUnitName,
    //       shortName: newUnitShortName,
    //     });
    //     if (res?.data) {
    //       setUnits(prev => [...prev, res.data]);
    //       setUnitId(res.data.id);
    //     }
    //     setNewUnitName('');
    //     setNewUnitShortName('');
    //     setUnitModalOpen(false);
    //   } catch (e) {}
    // };

    if (mode === 'project') {
      payload.projectId = projectId || (item as any)?.projectId || 0;
      payload.amount = quantity * rateMrp;
    } else {
      payload.quotationId = quotationId || (item as any)?.quotationId || 0;
      payload.totalCost = calcTotal;
    }

    setSaving(true);
    try {
      const hasValidId =
        mode === 'project'
          ? payload.projectId && payload.projectId > 0
          : payload.quotationId && payload.quotationId > 0;

      let saved: any = {
        ...payload,
        id: (item as any)?.id,
        totalCost:
          mode === 'project'
            ? payload.amount + (payload.amount * taxPercentage) / 100
            : calcTotal,
      };

      if (hasValidId) {
        let res: any = null;
        if (mode === 'project') {
          if (isEdit && item?.id)
            res = await ProjectAPI.updateItem(item.id, payload);
          else res = await ProjectAPI.createItem(payload);
        } else {
          if (isEdit && item?.id)
            res = await QuotationAPI.updateItem(item.id, payload);
          else res = await QuotationAPI.createItem(payload);
        }
        const returned = res?.data || {};
        saved.id = returned.id || saved.id;
      }

      onSaved(saved);
      onDismiss();
    } catch (e) {
      // swallow; host can handle error display if needed
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>
          {title || (isEdit ? tr('Edit Item') : tr('Add Item'))}
        </Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView style={{ maxHeight: maxHeight }}>
            <TextInput
              label={tr('Item Name *')}
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={{ margin: 8 }}
            />
            <TextInput
              label={tr('Description')}
              value={desc}
              onChangeText={setDesc}
              mode="outlined"
              style={{ margin: 8 }}
              multiline
              numberOfLines={2}
            />
            <TextInput
              label={tr('Quantity *')}
              value={qty}
              onChangeText={setQty}
              mode="outlined"
              keyboardType="numeric"
              style={{ margin: 8 }}
            />
            <View
              style={{
                marginHorizontal: 8,
                marginTop: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <Dropdown
                  style={{
                    borderWidth: 1,
                    borderColor: '#ccc',
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    height: 50,
                  }}
                  placeholderStyle={{ color: '#777' }}
                  selectedTextStyle={{ color: '#000' }}
                  data={unitDropdown}
                  labelField="label"
                  valueField="value"
                  placeholder={tr('Unit *')}
                  value={unitId}
                  onChange={it => setUnitId(it.value)}
                  renderItem={(item: any) => (
                    <TouchableOpacity
                      style={{ paddingVertical: 10, paddingHorizontal: 12 }}
                      onLongPress={() =>
                        confirmDeleteUnit(item.value, item.label)
                      }
                    >
                      <Text>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
              <IconButton
                icon="plus"
                onPress={() => setUnitModalOpen(true)}
                accessibilityLabel="Add Unit"
              />
            </View>
            <TextInput
              label={mode === 'quotation' ? tr('MRP *') : tr('Rate (MRP) *')}
              value={mrp}
              onChangeText={setMrp}
              mode="outlined"
              keyboardType="numeric"
              style={{ margin: 8 }}
              left={<TextInput.Affix text="₹" />}
            />
            <TextInput
              label={tr('HSN/SAC Code')}
              value={hsn}
              onChangeText={setHsn}
              mode="outlined"
              style={{ margin: 8 }}
              keyboardType="numeric"
            />
            <TextInput
              label={tr('Tax Percentage *')}
              value={tax}
              onChangeText={setTax}
              mode="outlined"
              keyboardType="numeric"
              style={{ margin: 8 }}
              right={<TextInput.Affix text="%" />}
            />
            <Text style={{ marginHorizontal: 12, marginBottom: 8 }}>
              {tr('Total')}: ₹{calcTotal.toFixed(2)}
            </Text>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{tr('Cancel')}</Button>
          <Button
            onPress={doSave}
            disabled={!canSave || saving}
            loading={saving}
          >
            {tr('Save')}
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Add Unit Dialog */}
      <Dialog visible={unitModalOpen} onDismiss={() => setUnitModalOpen(false)}>
        <Dialog.Title>{tr('Add New Unit')}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label={tr('Unit Name')}
            value={newUnitName}
            onChangeText={setNewUnitName}
            mode="outlined"
            style={{ marginBottom: 8 }}
          />
          <TextInput
            label={tr('Short Name')}
            value={newUnitShortName}
            onChangeText={setNewUnitShortName}
            mode="outlined"
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setUnitModalOpen(false)}>
            {tr('Cancel')}
          </Button>
          <Button onPress={addUnit}>{tr('Add')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ItemDialog;
