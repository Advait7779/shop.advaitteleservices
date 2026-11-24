const MAX_OFFSET = 100000;

const parsePagination = (query, { defaultLimit = 25, maxLimit = 100 } = {}) => {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? defaultLimit : Number(query.limit);
  const skip = (page - 1) * limit;

  if (!Number.isSafeInteger(page) || page < 1 ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > maxLimit ||
      !Number.isSafeInteger(skip) || skip > MAX_OFFSET) {
    throw new Error(`page must be a positive integer, limit must be between 1 and ${maxLimit}, and the requested page must be within the first ${MAX_OFFSET} records.`);
  }

  return { page, limit, skip };
};

module.exports = { parsePagination };
