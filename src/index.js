import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import ConnectionDirective from './examples/1.ConnectionDirective'
import LoadingState from './examples/2.LoadingState'
import ReactivePagesInViewHierarchy from './examples/3.ReactivePagesInViewHierarchy'

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

const routes = {
  ConnectionDirective: ConnectionDirective,
  LoadingState: LoadingState,
  ReactivePagesInViewHierarchy: ReactivePagesInViewHierarchy
}

const App = () => {
  const [route, setRoute] = useState('')

  const RouteComponent = routes[route]

  return (
    <>
      {
        Object.keys(routes).map((r, i) => <button style={{ cursor: 'pointer' }} onClick={() => setRoute(r)} key={i}>{r}</button>)
      }
      <div style={{ marginTop: 30 }}>
        {
          RouteComponent && <RouteComponent />
        }
      </div>
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
