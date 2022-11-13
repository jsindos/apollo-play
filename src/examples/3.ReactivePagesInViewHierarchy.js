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

// `Profile` component represents a route, which is only loaded once a user has authenticated at least once
// even if the user then logs out, this route is still in the view hierarchy, and is reacting to graphql state

// these views should be removed from view hierarchy once they are navigated away from
// or the queries should be removed from being watched as a cleanup step

// there is an error when logging in and this view is already in hierarchy
//   - this is triggered using `Log in then toggle user display` button after having already loaded `Profile`
// there is an error when logging out and this view is already in hierarchy
export default () => {
  const [events, setEvents] = useState([])
  const [hasAuthenticated, setHasAuthenticated] = useState(false)

  const [isDisplayUser, setIsDisplayUser] = useState(true)

  const [LoginMutation] = useMutation(Login)
  const [LogoutMutation] = useMutation(Logout)

  // const [getAuthenticatedUser] = useLazyQuery(AuthenticatedUser)

  return (
    <>
      <button onClick={async () => { setEvents([...events, 'calling LoginMutation']); await LoginMutation(); setHasAuthenticated(true) }}>Login</button>
      <button onClick={() => { setEvents([...events, 'calling LogoutMutation']); LogoutMutation() }}>Logout</button>
      {/* <button onClick={() => { setEvents([...events, 'calling AuthenticatedUser lazily']); getAuthenticatedUser() }}>Load user</button> */}
      <button onClick={() => { setEvents([...events, `toggle user display to ${!isDisplayUser}`]); setIsDisplayUser(!isDisplayUser) }}>Toggle user display</button>
      <button onClick={async () => {
        setEvents([...events, 'calling LoginMutation', `toggle user display to ${!isDisplayUser}`])
        LoginMutation()
        setHasAuthenticated(true)
        setIsDisplayUser(!isDisplayUser)
      }}
      >
        Log in then toggle user display
      </button>
      <h4>events:</h4>
      {
        events.map((e, i) => <div key={i}><code>{e}</code></div>)
      }
      {
       isDisplayUser ? (hasAuthenticated ? <Profile {...{ events, setEvents }} /> : <h4>has not authenticated</h4>) : <h4>is not displaying user</h4>
      }
    </>
  )
}

// this page is only loaded if user has authenticated at least once
// `loading` state is specific to this query
// other queries calling `AuthenticatedUser` will not effect the initial `loading` status of this query (seen by calling `AuthenticatedUser` above)
const Profile = ({ events, setEvents }) => {
  const { data: { session: { authenticatedUser } } = { session: {} }, loading } = useQuery(AuthenticatedUser)

  useEffect(() => {
    setEvents([...events, `loading \`AuthenticatedUser\`: ${loading}`])
  }, [loading])

  if (loading) return <div>loading</div>

  return (
    <>
      <h4>user:</h4>
      <code>{authenticatedUser.username}</code>
    </>
  )
}
