import React from 'react'
import ReactDOM from 'react-dom'
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useMutation, useQuery } from '@apollo/client'

const client = new ApolloClient({
  uri: 'http://localhost:8081/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Session: {
        fields: {
          products: {
            merge (existing, incoming) {
              // this is only being called on useQuery(HydrateSession), not useMutation(UpsertProduct)
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
  query {
    session {
      id
      products {
        id
      }
    }
  }
`

const App = () => {
  useQuery(HydrateSession)
  const [upsertProductMutation] = useMutation(UpsertProduct)

  const onClick = async () => {
    await upsertProductMutation({
      variables: {
        product: {
          id: 2
        }
      },
      update: (cache, mutationResult) => {
        cache.modify({
          id: 'Session:1',
          fields: {
            products: previous => [...previous, mutationResult.data.upsertProduct]
          }
        })
      }
    })
  }

  return (
    <div onClick={onClick} style={{ border: '1px solid #222', cursor: 'pointer', padding: '10px' }}>
      Upsert product with id 2
    </div>
  )
}

const wrapper = document.getElementById('root')
ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  wrapper
)
