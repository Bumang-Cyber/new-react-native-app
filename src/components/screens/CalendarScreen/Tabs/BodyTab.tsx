import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

type Item = {
  id: string;
  title: string; // 예: "아침"
  detail: string; // 예: "오트밀, 바나나, 요거트"
};

// WorkoutTab
export const INITIAL_WORKOUT_DATA: Item[] = [
  { id: '1', title: '하체', detail: '스쿼트 5×5 · 레그프레스 4×10' },
  { id: '2', title: '상체', detail: '벤치프레스 5×5 · 로우 4×8' },
  { id: '3', title: '유산소', detail: '런닝머신 30분 (경사 3%)' },
  { id: '4', title: '코어', detail: '플랭크 3×60초 · 데드버그 3×12' },
];

const ItemSeparator = () => <View style={styles.ItemSeparator} />;

const BodyTab = () => {
  const [data] = useState<Item[]>(INITIAL_WORKOUT_DATA);
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

export default BodyTab;

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
