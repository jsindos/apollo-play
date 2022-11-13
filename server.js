const express = require('express')
const app = express()
const { ApolloServer } = require('apollo-server-express')
const { makeExecutableSchema } = require('graphql-tools')

const port = process.env.PORT || 8081
const hostname = '0.0.0.0'

const typeDefs = [`
  type Query {
    session: Session
  }

  type Session {
    products(isDecrementingInventory: Boolean): [Product]
    authenticatedUser: User
  }

  type Product {
    id: Int
  }

  type User {
    id: Int
    username: String
    firstName: String
  }

  type Mutation {
    upsertProduct(product: ProductInput!): Product
    login: Session
    logout: Session
  }

  input ProductInput {
    id: Int
  }
`]

let id = 1

const user = { id: 1, username: 'jt', firstName: 'Joe' }
let isAuthenticated = false

const resolvers = {
  Query: {
    session () {
      return {}
    }
  },
  Mutation: {
    upsertProduct (root, args) {
      const { product: { id } } = args
      return { id }
    },
    login () {
      isAuthenticated = true
      return {}
    },
    logout () {
      isAuthenticated = false
      return {}
    }
  },
  Session: {
    products () {
      const products = [{ id }]
      id++
      return products
    },
    authenticatedUser () {
      return isAuthenticated ? user : null
    }
  }
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
})

const origin = function (origin, callback) {
  return callback(null, true)
}

async function serve () {
  const server = new ApolloServer({
    schema,
    formatError: (e) => {
      console.error(JSON.stringify(e, null, 2))
      return e
    }
  })

  await server.start()

  // https://stackoverflow.com/questions/54485239/apollo-server-express-cors-issue
  server.applyMiddleware({
    app,
    cors: { credentials: true, origin }
  })

  await new Promise(resolve => app.listen(port, hostname, resolve))
  console.log(`Server running at http://${hostname}:${port}/`)
  console.log(`graphql running at http://${hostname}:${port}${server.graphqlPath}`)
}

serve()
