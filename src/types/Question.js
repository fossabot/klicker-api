/* eslint-disable no-use-before-define */

// HACK: export before require such that circular dependencies can be handled
module.exports = () => [
  Question,
  QuestionInstance,
  Tag,
  FREEQuestionOptions,
  SCQuestionOptions,
]

const Tag = require('./Tag')
const QuestionInstance = require('./QuestionInstance')
const FREEQuestionOptions = require('./questionTypes/FREEQuestionOptions')
const SCQuestionOptions = require('./questionTypes/SCQuestionOptions')

const Question = `
  union QuestionOptions = SCQuestionOptions | FREEQuestionOptions
  union QuestionOptions_Public = SCQuestionOptions_Public | FREEQuestionOptions_Public

  enum Question_Type {
    SC
    MC
    FREE
    FREE_RANGE
  }

  input QuestionOptionsInput {
    randomized: Boolean
    restrictions: FREEQuestionOptions_RestrictionsInput

    choices: [SCQuestionOptions_ChoiceInput!]
  }
  type Question_Options {
    SC: SCQuestionOptions
    MC: SCQuestionOptions
    FREE_RANGE: FREEQuestionOptions
  }
  type Question_Options_Public {
    SC: SCQuestionOptions_Public
    MC: SCQuestionOptions_Public
    FREE_RANGE: FREEQuestionOptions_Public
  }

  input Question_SolutionInput {
    FREE: String
    FREE_RANGE: Int

    SC: [Boolean!]
    MC: [Boolean!]
  }
  type Question_Solution {
    FREE: String
    FREE_RANGE: Int

    SC: [Boolean!]
    MC: [Boolean!]
  }

  input QuestionInput {
    title: String!
    type: Question_Type!
    content: String!

    options: QuestionOptionsInput!
    solution: Question_SolutionInput

    tags: [ID!]!
  }
  input QuestionModifyInput {
    title: String
    content: String
    options: QuestionOptionsInput
    solution: Question_SolutionInput

    tags: [ID!]
  }
  type Question {
    id: ID!
    title: String!
    type: Question_Type!
    isArchived: Boolean

    user: User!

    instances: [QuestionInstance!]!
    tags: [Tag!]!
    versions: [Question_Version!]!

    createdAt: String!
    updatedAt: String!
  }
  type Question_Public {
    id: ID!
    instanceId: ID!
    title: String!
    type: Question_Type!
    content: String
    description: String!
    options: Question_Options
    solution: Question_Solution
  }
  type Question_PublicEvaluation {
    id: ID!
    title: String!
    type: Question_Type!

    versions: [Question_Version_Public!]!
  }

  type Question_Version {
    id: ID!
    content: String
    description: String!

    options: Question_Options
    solution: Question_Solution

    instances: [QuestionInstance!]!

    createdAt: String!
    updatedAt: String!
  }
  type Question_Version_Public {
    id: ID!
    description: String!
    options: Question_Options_Public
  }
`
