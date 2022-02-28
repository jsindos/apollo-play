import React from 'react'
import ReactDOM from 'react-dom'
import { ApolloClient, InMemoryCache, ApolloProvider, gql, useMutation } from '@apollo/client'

const client = new ApolloClient({
  uri: 'http://localhost:8081/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Maker: {
        fields: {
          products: {
            // update cache in withUpsertProduct is always run, leading to duplicates
            // merge (existing, incoming) {
            //   console.log('existing', JSON.stringify(existing, null, 2))
            //   console.log('incoming', JSON.stringify(incoming, null, 2))
            //   if (incoming.filter(p => p.id === incoming[incoming.length - 1].id).length > 1) return existing
            //   return incoming
            // }
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

const App = () => {
  const [upsertProductMutation] = useMutation(UpsertProduct)

  const onClick = async () => {
    const { data: { upsertProduct } } = await upsertProductMutation({
      variables: {
        product: {
          id: 1
        }
      }
      // update: (cache, mutationResult) => {
      //   cache.modify({
      //     id: `${maker.__typename}:${maker.id}`,
      //     fields: {
      //       products: previous => [...previous, mutationResult.data.upsertProduct]
      //     }
      //   })
      // }
    })
  }

  return (
    <div onClick={onClick} style={{ border: '1px solid #222' }}>
      Press me
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
