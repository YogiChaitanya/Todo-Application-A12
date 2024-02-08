const express = require('express')
const path = require('path')


// date related modules
const isValid = require('date-fns/isValid')
const format = require('date-fns/format')


// database
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')



// access the database purpose
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initiallizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(
        'Server Running at https://yogichaitanyapncjfnjscadoqbs.drops.nxtwave.tech:3000/',
      )
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`)
    process.exit(1)
  }
}
initiallizeDBAndServer()


//import values
const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
const categoryArray = ['WORK', 'HOME', 'LEARNING']







// Invalid scenarios for all APIs
const invalidScenarios = (request, response, next) => {
  const {status, priority, category, dueDate} = request.query
  switch (true){
    case (request.status !== undefined):
        if (statusArray.includes(status) === undefined){
            response.status(400)
            response.send('Invalid Todo Status')
          }
        else{
          next()
        }
    break
    case (request.priority !== undefined):
        if (priorityArray.includes(priority) === undefined){
            response.status(400)
            response.send("Invalid Todo Priority")
        }
        else{
          next()
        }
    break
    case (request.category !== undefined):
        if (categoryArray.includes(category) === undefined){
            response.status(400)
            response.send("Invalid Todo Category")
        }
        else{
          next()
        }
    break
    case (request.dueDate !== undefined):
        if (isValid.includes(dueDate) === undefined){
            response.status(400)
            response.send("Invalid Due Date")
        }
        else{
          next()
        }
    break
  }
}





// API 1
const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}
const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasPriorityAndStatusProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasCategoryAndStatusProperty = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}
const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}
const hasCategoryAndPriorityPropertry = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

app.get('/todos/', invalidScenarios, async (request, response) => {
  let data = null
  let getTodoQuery = ''
  const {status, priority, search_q = '', category} = request.query
  switch (true) {
    case hasStatusProperty(request.query):
      getTodoQuery = `
          SELECT
            *
          FROM 
            todo
          WHERE
            status='${status}';`
      break
    case hasPriorityProperty(request.query):
      getTodoQuery = `
        SELECT
          *
        FROM 
          todo
        WHERE
          priority='${priority}';`
      break
    case hasPriorityAndStatusProperty(request.query):
      getTodoQuery = `
        SELECT 
          *
        FROM
          todo
        WHERE
          priority='${priority}'
          AND status='${status}';`
      break

      //we have to check
    case hasCategoryAndStatusProperty(request.query):
      getTodoQuery = `
        SELECT
          *
        FROM
          todo
        WHERE
          category='${category}'
          AND status='${status}';`
      break
    case hasCategoryProperty(request.query):
      getTodoQuery = `
        SELECT
          *
        FROM
          todo
        WHERE
          category='${category}';`
      break
    case hasCategoryAndPriorityPropertry(request.query):
      getTodoQuery = `
        SELECT 
          *
        FROM
          todo
        WHERE
          category='${category}'
          AND priority='${priority}';`
      break
    default:
      getTodoQuery = `
        SELECT 
          *
        FROM
          todo
        WHERE
          todo LIKE '%${search_q}%';`
  }

  const convertDBObjectToResponseObject = dbObject => {
    return {
      id: dbObject.todoId,
      todo: dbObject.todo,
      priority: dbObject.priority,
      status: dbObject.status,
      category: dbObject.category,
      dueDate: dbObject.due_date,
    }
  }

  data = await db.all(getTodoQuery)
  response.send(data.map(eachTodo => convertDBObjectToResponseObject(eachTodo)))
})


// API 2
app.get('/todos/:todoId/', invalidScenarios, async (request, response) => {
  const {todoId} = request.params
  const getSpecifiTodoById = `SELECT * FROM todo WHERE id=${todoId};`
  const todo = await db.get(getSpecifiTodoById)
  response.send(todo)
})



// API 3
app.get('/agenda/', invalidScenarios, async (request, response) => {
  const getDateLikeFormat = format(new Date(2021, 01, 21), 'yyyy-MM-dd')
  const getDueDateDetails = `SELECT * FROM todo WHERE due_date='${getDateLikeFormat}';`
  const todoByDate = await db.all(getDueDateDetails)
  response.send(todoByDate)
})




// API 4
app.post('/todos/', async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status, category, dueDate} = todoDetails
  const addTodoQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date) VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`
  await db.run(addTodoQuery)
  response.send('Todo Successfully Added')
})


// API 5
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body

  let updateColumn = ''
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
    case requestBody.category !== undefined:
      updateColumn = 'Category'
      break
    case requestBody.dueDate !== undefined:
      updateColumn = 'Due Date'
      break
  }

  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`
  const previousTodo = await db.get(previousTodoQuery)

  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body

  const updateTodoQuery = `
      UPDATE
        todo
      SET 
        status='${status}',
        priority='${priority}',
        todo='${todo}',
        category='${category}',
        due_date='${dueDate}'
      WHERE 
        id=${todoId};`
  await db.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})



// API 6
app.delete('/todos/:todoId/', invalidScenarios,  async (request, response) => {
  const {todoId} = request.params
  const deleteTodo = `DELETE FROM todo WHERE id=${todoId};`
  await db.run(deleteTodo)
  response.send('Todo Deleted')
})



module.exports = app
