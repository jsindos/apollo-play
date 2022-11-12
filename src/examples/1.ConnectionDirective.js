import React from 'react'
import { gql, useMutation, useQuery, useApolloClient } from '@apollo/client'

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

export default () => {
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
      // `key` is the name that the cache stores the field under, and `filter` are the arguments to cache with
      // empty `filter` means that no arguments are cached
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
