import React from 'react'
import ReactDOM from 'react-dom'
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useMutation, useQuery, useApolloClient } from '@apollo/client'

const client = new ApolloClient({
  uri: 'http://localhost:8081/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Session: {
        keyFields: [],
        fields: {
          products: {
            merge (existing, incoming) {
              // this is only being called on useQuery(HydrateSession), not useMutation(UpsertProduct)
              // see https://stackoverflow.com/questions/71290327/custom-merge-function-is-not-being-called-after-updating-field-with-cache-modify
              console.log('existing', JSON.stringify(existing, null, 2))
              console.log('incoming', JSON.stringify(incoming, null, 2))
              // remove duplicates when latestProduct has the same id as an existing product — [..., latestProduct]
              if (incoming.filter(p => p.id === incoming[incoming.length - 1].id).length > 1) return existing
              return incoming
            }
          }
        }
      }
    }
  })
})

const UpsertProduct = gql`
  mutation UpsertProduct($product: ProductInput!) {
    upsertProduct(product: $product) {
      id
    }
  }
`

const HydrateSession = gql`
  query($isDecrementingInventory: Boolean) {
    session {
      products(isDecrementingInventory: $isDecrementingInventory) @connection(key: "products", filter: []) {
        id
      }
    }
  }
`

const App = () => {
  const { data: { session: { products } } = { session: {} }, loading } = useQuery(HydrateSession)
  const [upsertProductMutation] = useMutation(UpsertProduct)

  const client = useApolloClient()

  const onClickUpsertProduct = async () => {
    await upsertProductMutation({
      variables: {
        product: {
          id: 2
        }
      },
      update: (cache, mutationResult) => {
        cache.modify({
          id: 'Session:{}',
          fields: {
            products: previous => [...previous, mutationResult.data.upsertProduct]
          }
        })
      }
    })
  }

  const onClickRefetch = async () => {
    await client.query({
      query: HydrateSession,
      // usually, queries are cached with their arguments, meaning calling a query will not update the same query with different arguments
      // however, using the connection directive allows us to store the query without the extra arguments
      // https://github.com/apollographql/apollo-client/issues/2991#issuecomment-423834445
      variables: { isDecrementingInventory: true },
      fetchPolicy: 'network-only'
    })
  }

  if (loading) return <div>loading</div>

  return (
    <>
      <div onClick={onClickUpsertProduct} style={{ border: '1px solid #222', cursor: 'pointer', padding: '10px' }}>
        Upsert product with id 2
      </div>
      <div onClick={onClickRefetch} style={{ border: '1px solid #222', cursor: 'pointer', padding: '10px' }}>
        re-fetch query with a different query argument
      </div>
      <h3>
        ids of products in cache
      </h3>
      {
        products.map((p, i) => <div key={i}>{p.id}</div>)
      }
    </>
  )
}

const wrapper = document.getElementById('root')

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  wrapper
)
