const QUESTION_TYPES = {
  SC: 'SC',
  MC: 'MC',
  FREE: 'FREE',
  FREE_RANGE: 'FREE_RANGE',
}

const QUESTION_GROUPS = {
  CHOICES: [QUESTION_TYPES.SC, QUESTION_TYPES.MC],
  FREE: [QUESTION_TYPES.FREE, QUESTION_TYPES.FREE_RANGE],
  WITH_OPTIONS: [
    QUESTION_TYPES.SC,
    QUESTION_TYPES.MC,
    QUESTION_TYPES.FREE_RANGE,
  ],
}

const QUESTION_BLOCK_STATUS = {
  PLANNED: 'PLANNED',
  ACTIVE: 'ACTIVE',
  EXECUTED: 'EXECUTED',
}

const SESSION_STATUS = {
  CREATED: 'CREATED',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
}

const SESSION_ACTIONS = {
  START: 'START',
  PAUSE: 'PAUSE',
  STOP: 'STOP',
}

const Errors = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_SHORTNAME: 'INVALID_SHORTNAME',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  SESSION_ALREADY_STARTED: 'SESSION_ALREADY_STARTED',
}

module.exports = {
  QUESTION_TYPES,
  QUESTION_GROUPS,
  QUESTION_BLOCK_STATUS,
  SESSION_STATUS,
  SESSION_ACTIONS,
  Errors,
}
