const db = require('./db');

const Query = {
    company:(_ , {id}) => db.companies.get(id),
    jobs: () => db.jobs.list(),
    job:(_, { id }) => db.jobs.get(id)
}

const Mutation = {
    createJob:(_, {input}, {user}) => {
        if(!user) {
            throw new Error('Unauthorized');
        }
        const id = db.jobs.create({...input, companyId: user.companyId});
        return db.jobs.get(id);
    }
}

const Job = {
    company: (job) => db.companies.get(job.companyId)
}

const Company = {
    jobs: (company) => db.jobs.list().filter(job => job.companyId === company.id)
}

module.exports = { Query, Mutation, Job, Company };