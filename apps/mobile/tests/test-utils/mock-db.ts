type QueryResult = {
  all?: unknown[];
  get?: unknown;
};

interface MockDbOptions {
  selectResults?: QueryResult[];
}

const createBuilder = (result: QueryResult) => ({
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  values: jest.fn().mockResolvedValue(result.all ?? result.get),
  all: jest.fn().mockResolvedValue(result.all ?? []),
  get: jest.fn().mockResolvedValue(result.get),
});

export const createMockDb = ({ selectResults = [] }: MockDbOptions = {}) => {
  const selectQueue = [...selectResults];
  const insertBuilder = createBuilder({});
  const updateBuilder = createBuilder({});
  const deleteBuilder = createBuilder({});

  return {
    select: jest.fn(() => createBuilder(selectQueue.shift() ?? {})),
    insert: jest.fn(() => insertBuilder),
    update: jest.fn(() => updateBuilder),
    delete: jest.fn(() => deleteBuilder),
    __builders: {
      insert: insertBuilder,
      update: updateBuilder,
      delete: deleteBuilder,
    },
  };
};
