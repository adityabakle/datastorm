Inspired by [Sequel] for ruby, sequel-node aims to be a database toolkit for
[node]

* Sequel-node currently has adapters for mysql

# A short example #

    var Sequel = require('sequel');

    DB = new Sequel.mysql({username: 'root', password: '', host: 'localhost', database: 'sequel_test'})

    items = DB.ds('items') // create a dataset

    // print out the number of records
    items.count(function(err, count) { console.log(count); })

# An Introduction #

Like [Sequel], Sequel-node uses the concept of datasets to retrieve data. A Dataset
object encapsulates an SQL query and supports chainability, letting you fetch
data using a convenient JavaScript DSL that is both concise and flexible.

Sequel uses the same concepts of datasets to retrieve data. A Dataset object
encapsulates an SQL query and supports chainability, letting you fetch data
using a convenient JavaScript DSL that is both concise and flexible.

    DB.ds('countries').where({region: 'Middle East'}).count()

is equivalent to

    SELECT COUNT(*) as count FROM `countries` WHERE region='Middle East'


# Sequel Models #
A model class wraps a dataset, and an instance of that class wraps a single
record in the dataset.

Model classes are defined as regular Ruby classes inheriting from
Sequel.Model

Using coffee script syntax (use http://js2coffee.org/ to translate) for sake
of abbriviation:

    DB = new Sequel.mysql {username: 'root', password: '', host: 'localhost', database: 'sequel_test'}

    class Post extends Sequel.Model
      @db = DB

Sequel model classes assume that the table name is an underscored plural of
the class name:

    Post.table_name() //=> :posts

## Model instances ##
Model instances are identified by a primary key. Sequel currently only uses
'id' for primary key.

    Post.find 123, (err, post) ->
      post.id #=> 123

## Accessing record values ##
A model instance stores its values as a hash with column symbol keys, which
you can access directly via the values method:

    Post.find 123, (err, post) ->
      post.values #=> {id: 123, category: 'coffee-script', title: 'hello world'}

You can read the record values as object attributes, assuming the attribute
names are valid columns in the model's dataset:

    post.id #=> 123
    post.title #=> 'hello world'

If the record's attributes names are not valid columns in the model's dataset
(maybe because you used select\_append to add a computed value column), you can
use Model[] to access the values:

    post['id'] #=> 123
    post['title'] #=> 'hello world'

You can also modify record values using attribute setters, the []= method, or
the set method:

    post.title = 'hey there'
    # or
    post['title'] = 'hey there'
    # or

That will just change the value for the object, it will not update the row in
the database. To update the database row, call the save method:

    post.save (err, value) ->
      value #=> value is equal to the id for a new record, or numbers of records altered for an update


## Associations ##
Associations are used in order to specify relationships between model classes
that reflect relationships between tables in the database, which are usually
specified using foreign keys. You specify model associations via the
many\_to\_one, one\_to\_one, one\_to\_many, and many\_to\_many class methods:

    class Post extends Sequel.Model
      many\_to\_one 'author'
      one\_to\_many 'comments'
      many\_to\_many 'tags'

The defined calls can be called directly on the created object:

    Post.find 123, (err, post) ->
      post.comments.all (err, comments) ->
        for comment in comments
          console.log comment

## Model Validations ##
You can define a validate method for your model, which save will check before
attempting to save the model in the database. If an attribute of the model
isn't valid, you should add a error message for that attribute to the model
object's errors. If an object has any errors added by the validate method,
save will return an error.

    class Post extends Sequel.Model
      @validate 'name', (name) ->
        @errors.add name, "cant be bob" if name == 'bob'

[Sequel]: http://sequel.rubyforge.org/
[node]: http://nodejs.org/
