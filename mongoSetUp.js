use event
db.dropDatabase()
use event
db.createCollection('events')
db.events.insert({title:'Game of Thrones SE6E04', description: 'GOTS06E01', user:'marc.g.underwood@gmail.com',likes: 5, eventTime:  new Date('May 13, 2016 17:00:00')})
db.events.findOne()
db.createCollection('users')
db.users.insert({email:'marg.g.underwood@gmail.com', name: 'marc', password:'ch')})
db.users.find({ $and: [ { email: 'marg.g.underwood@gmail.com' }, { password: 'ch'} ] })
db.events.insert({title:'Graduation WDI13', description: 'woo hoo', user:'marc.g.underwood@gmail.com',likes: 25, eventTime:  new Date('May 13, 2016 17:00:00')})
db.events.insert({title:'Rio Olympics opening ceremony', description: 'Maracana', user:'marc.g.underwood@gmail.com',likes: 12, eventTime:  new Date('Aug 06, 2016 09:00:00')})
db.events.insert({title:'Monaco Grand Prix', description: 'vroom', user:'marc.g.underwood@gmail.com',likes: 3, eventTime:  new Date('May 29, 2016 21:00:00')})
