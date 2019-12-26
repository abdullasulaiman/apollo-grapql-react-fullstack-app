import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from 'apollo-boost';
import { isLoggedIn, getAccessToken } from "./auth";
import gql from 'graphql-tag';

const endpointURL = "http://127.0.0.1:9000/graphql";
const authLink = new ApolloLink((operation, forward) => {
    if(isLoggedIn()) {
        operation.setContext({
            headers: {
                'authorization' : 'Bearer ' + getAccessToken()
            }
        })
    }
    return forward(operation)
})

const client = new ApolloClient({
    link: ApolloLink.from([
        authLink,
        new HttpLink({ uri: endpointURL })
    ]),
    cache: new InMemoryCache()
})

// async function graphqlRequest(query, variables = {}) {
//     const request = {
//         method: "POST",
//         headers: {
//           "content-type": "application/json"
//         },
//         body: JSON.stringify({query, variables})
//     }
//     if(isLoggedIn()) {
//         request.headers['authorization'] = `Bearer ${getAccessToken()}`;
//     }
//     const response = await fetch(endpointURL, request);
//     const responseBody = await response.json();
//     if(responseBody.errors) {
//         let message = responseBody.errors.map( err => err.message).join('\n');
//         throw new Error(message);
//     }
//     return responseBody.data;
// }

const jobQuery = gql`query JobQuery($id:ID!) {
    job(id: $id) {
        id
        title
        company {
            id
            name
        }
        description
    }
}`

export async function loadJobs() {
  const query = gql`{
    jobs {
        id
        title
        company {
            id
            name
        }
    }
  }`
  const { data : { jobs }} = await client.query({ query, fetchPolicy: 'no-cache' });
  return jobs;
}

export async function loadJob(id) {
     const { data : { job }} = await client.query({ query: jobQuery, variables: {id} });
     return job;
}

export async function loadCompany(id) {
    const query = gql`query CompanyQuery($id:ID!) {
        company(id: $id) {
          id
          name
          description
          jobs {
              id
              title
          }
        }  
      }`
    const { data : { company }} = await client.query({ query, variables: {id} });
    return company;
}

export async function createJob(input) {
    const mutation = gql`mutation CreateJob($input: CreateJobInput) {
        job: createJob(input: $input) {
          id
          title
          company {
            id
            name
          }
        }
      }`
    const { data : { job }} = await client.mutate({ 
        mutation, 
        variables: {input},
        update: (cache, mutationResult) => {
            cache.writeQuery({
                query: jobQuery,
                variables: { id: mutationResult.data.job.id },
                data: mutationResult.data
            })
        }
    });
    return job;
}
