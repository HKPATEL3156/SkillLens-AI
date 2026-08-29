const MLExecution = require("../models/MLExecution");

/**
 * Creates a new MLExecution record in the database.
 */
async function createExecution(
  { userId, entityType, entityId, modelName, modelVersion, status, rawOutput, error },
  session
) {
  try {
    const exec = new MLExecution({
      userId,
      entityType,
      entityId,
      modelName,
      modelVersion,
      status,
      rawOutput,
      error,
    });
    const options = session ? { session } : {};
    return await exec.save(options);
  } catch (err) {
    console.error("[WARN] Failed to save MLExecution log:", err.message);
    return null;
  }
}

/**
 * Updates an existing MLExecution record by ID.
 */
async function updateExecution(id, { status, rawOutput, error }, session) {
  try {
    const options = session ? { session, new: true } : { new: true };
    return await MLExecution.findByIdAndUpdate(
      id,
      { $set: { status, rawOutput, error } },
      options
    );
  } catch (err) {
    console.error("[WARN] Failed to update MLExecution log:", err.message);
    return null;
  }
}

module.exports = {
  createExecution,
  updateExecution,
};
