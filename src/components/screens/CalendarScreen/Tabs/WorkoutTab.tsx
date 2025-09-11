import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

type Item = {
  id: string;
  title: string; // 예: "아침"
  detail: string; // 예: "오트밀, 바나나, 요거트"
};

// BodyTab
export const INITIAL_BODY_DATA: Item[] = [
  { id: '1', title: '체중', detail: '70.2 kg (아침 공복)' },
  { id: '2', title: '체지방률', detail: '17.8 % (스마트체중계)' },
  { id: '3', title: '둘레', detail: '허리 82 cm · 가슴 98 cm' },
  { id: '4', title: '컨디션', detail: '수면 7h · 피로도 보통' },
];

const ItemSeparator = () => <View style={styles.ItemSeparator} />;

const WorkoutTab = () => {
  const [data] = useState<Item[]>(INITIAL_BODY_DATA);
  const isEmpty = data.length === 0;

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          isEmpty && styles.emptyContainer, // 비었을 때만 가운데 정렬
        ]}
        ItemSeparatorComponent={ItemSeparator}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDetail}>{item.detail}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>등록된 식단이 없습니다.</Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default WorkoutTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  listContent: {
    padding: 8,
  },
  ItemSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  card: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  cardTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  cardDetail: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
  },
});
