import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

type Item = {
  id: string;
  title: string; // 예: "아침"
  detail: string; // 예: "오트밀, 바나나, 요거트"
};

export const INITIAL_DIET_DATA: Item[] = [
  { id: '1', title: '아침', detail: '오트밀 · 바나나 · 그릭요거트' },
  { id: '2', title: '점심', detail: '닭가슴살 샐러드 · 고구마' },
  { id: '3', title: '저녁', detail: '연어 스테이크 · 구운 야채' },
  { id: '4', title: '간식', detail: '프로틴바 · 아메리카노' },
];

const ItemSeparator = () => <View style={styles.ItemSeparator} />;

const DietTab = () => {
  const [data] = useState<Item[]>(INITIAL_DIET_DATA);
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

export default DietTab;

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
