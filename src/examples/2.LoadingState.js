import { gql, useMutation, useQuery } from '@apollo/client'
import React, { useEffect, useState } from 'react'

/**
 * we are going to test if `loading` state of the `useQuery` hook is automatically updated, when a query automatically re-fetches data
 *
 * a query will automatically re-fetch data when a part of its state updates from another query
 *
 * for example, if there are two queries, `AuthenticatedUser` and `Orders`, with the following schemas:
 *
 * query AuthenticatedUser {
 *   session {
 *     authenticatedUser {
 *       id
 *       username
 *     }
 *   }
 * }
 *
 * query Orders($isViewingInbox: Boolean) {
 *   session(isViewingInbox: $isViewingInbox) {
 *       authenticatedUser {
 *         id
 *         firstName
 *       }
 *     }
 *   }
 * }
 *
 * if `AuthenticatedUser` is re-fetched, and returns different data for `authenticatedUser`, then `Orders` will be automatically re-run
 * we are wondering if the `loading` state of `Orders` will update to `true` when it is automatically re-run
 *
 * we will construct this example, with just `Login` / `Logout` / `AuthenticatedUser` instead
 */

const AuthenticatedUser = gql`
  query AuthenticatedUser {
    session {
      authenticatedUser {
        id
        username
      }
    }
  }
`

const Login = gql`
  mutation Login {
    login {
      authenticatedUser {
        id
      }
    }
  }
`

const Logout = gql`
  mutation Logout {
    logout {
      authenticatedUser {
        id
      }
    }
  }
`

// as can be seen in the demo, calling `LoginMutation` after `AuthenticatedUser` has already initialised creates another network request for `AuthenticatedUser`, but does not set `loading` to true
// this is currently leading to errors in pop-f
export default () => {
  const [events, setEvents] = useState([])

  const { data: { session: { authenticatedUser } } = { session: {} }, loading } = useQuery(AuthenticatedUser)
  const [LoginMutation] = useMutation(Login)
  const [LogoutMutation] = useMutation(Logout)

  useEffect(() => {
    setEvents([...events, `loading \`AuthenticatedUser\`: ${loading}`])
  }, [loading])

  return (
    <>
      <button onClick={() => { setEvents([...events, 'calling LoginMutation']); LoginMutation() }}>Login</button>
      <button onClick={() => { setEvents([...events, 'calling LogoutMutation']); LogoutMutation() }}>Logout</button>
      <h4>events:</h4>
      {
        events.map((e, i) => <div key={i}><code>{e}</code></div>)
      }
      <h4>user:</h4>
      <code>{JSON.stringify(authenticatedUser, null, 2)}</code>
    </>
  )
}
