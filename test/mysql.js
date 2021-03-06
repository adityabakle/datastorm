var Code = require('code');
var DataStorm = require('../lib');
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var expect = Code.expect;


require("./_helper");

var expect = require('chai').expect;

var DB = new DataStorm.mysql({
    username: 'root',
    password: '',
    host: 'localhost',
    database: 'datastorm_test'
});

var List = DataStorm.model('list');
List.db = DB;
List.one_to_many('items');
List.many_to_many('tags');


var Item = DataStorm.model('item', DB);
Item.many_to_one('list');

var Tag = DataStorm.model('tag', DB);
Tag.many_to_many('lists');
Tag.validate('name', function(name, val, done) {

    return this.constructor.where({
        name: val
    }).first((function(_this) {

        return function(err, result) {

            if (result) {
                _this.errors.add(name, 'must be unique');
            }
            _this.ran = true;
            return done();
        };
    })(this));
});


var Actor = DataStorm.model('actor', DB);
Actor.prototype.after_create = function() {

    Actor.__super__.after_create.apply(this, arguments);
    return this.was_saved = true;
};

DataStorm.models = {
    Tag: Tag,
    List: List,
    Item: Item,
    Actor: Actor
};

describe("Mysql", function() {

    beforeEach(function(done) {

        var exec, spawn, _ref;
        _ref = require('child_process'), exec = _ref.exec, spawn = _ref.spawn;
        return exec('mysql -uroot datastorm_test < test/datastorm_test.sql', function() {
            return done();
        });
    });

    describe("Model", function() {

        it("should truncate table", function(done) {

            return Item.truncate(function(err) {

                return Item.all(function(err, items) {

                    items.length.should.equal(0);
                    return done();
                });
            });
        });

        it("should execute arbitrary command", function(done) {

            return Item.execute("TRuncATE `items`", function(err) {

                return Item.all(function(err, items) {

                    items.length.should.equal(0);
                    return done();
                });
            });
        });

        it("should call the after create after a new record has been created", function(done) {

            var character;
            character = new Actor({
                first_name: 'dexter',
                last_name: 'morgan',
                age: 34
            });

            return character.save(function(err, result) {

                character.was_saved.should.equal(true);
                return done();
            });
        });

        it("should be able to validate uniqueness using callbacks for validation", function(done) {

            var item;
            item = new Tag({
                name: "wish"
            });

            return item.save(function(err, result) {

                if (toString.call(err) === '[object Null]') {
                    'This should not be null.'.should.equal('');
                }
                err.should.equal('Validations failed. Check obj.errors to see the errors.');
                return done();
            });
        });

        it("should not run validations for fields which have not changed", function(done) {

            return Tag.first(function(err, tag) {

                expect(tag.ran).to.be.undefined;
                tag.id = 3;
                return tag.save(function(err, numChangedRows) {

                    expect(tag.ran).to.be.undefined;
                    return done();
                });
            });
        });

        it("should only run validations for fields which have changed", function(done) {

            return Tag.first(function(err, tag) {

                tag.name = 'something';
                expect(tag.ran).to.be.undefined;
                return tag.save(function(err, numChangedRows) {

                    tag.ran.should.equal(true);
                    return done();
                });
            });
        });

        it("should the first record as a model", function(done) {

            return List.first(function(err, list) {

                list.table_name().should.equal('lists');
                list.id.should.equal(51);
                list.name.should.equal('a list');
                return done();
            });
        });

        it("record retrieved should not be new", function(done) {

            return List.first(function(err, list) {

                list["new"].should.equal(false);
                return done();
            });
        });

        it("should fire the row_proc method for each record", function(done) {

            var ds, rows;
            ds = DB.ds('lists');
            rows = [];
            ds.set_row_func(function(result) {

                return new List(result);
            });
            return ds.first(function(err, row) {

                row.table_name().should.equal('lists');
                return done();
            });
        });

        it("should link to first record through one_to_many relationship", function(done) {

            return List.first(function(err, list) {

                return list.items().first(function(err, item) {

                    item.name.should.equal('an item');
                    item.constructor.model_name().should.equal('Item');
                    item.id.should.equal(42);
                    item.table_name().should.equal('items');
                    return done();
                });
            });
        });

        it("should link to records through one_to_many relationship", function(done) {

            return List.first(function(err, list) {

                return list.items().all(function(err, items) {

                    var item;
                    item = items[0];
                    item.name.should.equal('an item');
                    item.constructor.model_name().should.equal('Item');
                    item.id.should.equal(42);
                    item.table_name().should.equal('items');
                    return done();
                });
            });
        });

        it("should link to records through many_to_one relationship", function(done) {

            return Item.find(42, function(err, item) {

                item.name.should.equal('an item');
                item.constructor.model_name().should.equal('Item');
                return item.list(function(err, list) {

                    list.constructor.model_name().should.equal('List');
                    list.id.should.equal(51);
                    list.name.should.equal('a list');
                    return done();
                });
            });
        });

        it("should find all", function(done) {

            return Item.all(function(err, items) {

                items[0].name.should.equal('another item');
                items[0].constructor.model_name().should.equal('Item');
                items[1].name.should.equal('an item');
                return done();
            });
        });

        it("should count as model", function(done) {

            return Item.count(function(err, count) {

                count.should.equal(2);
                return done();
            });
        });

        it("should save a new item", function(done) {

            var item;
            item = new Item({
                id: 190,
                list_id: 12,
                name: "the new item"
            });

            item.save(function(err, result) {

                expect(err).to.equal(null);
                expect(result).to.equal(190);
                done();
            });
        });

        it("should behave well even if some values are bad", function(done) {

            var item;
            item = new Item({
                id: 190,
                flower: "there's no flower"
            });
            return item.save(function(err, result) {

                expect(err).to.not.equal(null);
                return done();
            });
        });

        it("should update a fetched item", function(done) {

            Item.find(42, function (err, item) {

                item.name = 'flower';
                item.save(function (err, result) {

                    expect(result).to.equal(1);
                    Item.find(42, function (err, result) {

                        expect(result.name).to.equal('flower');
                        done();
                    });
                });
            });
        });

        it("should delete a fetched item", function(done) {

            return Item.find(42, function(err, item) {

                return item["delete"](function(err, result) {

                    result.should.equal(item);
                    return Item.find(42, function(err, result) {

                        return done();
                    });
                });
            });
        });

        it("should create an item", function(done) {

            return Item.create({
                name: 'created item',
                list_id: 2
            }, function(err, item) {

                return Item.find(item.id, function(err, result) {

                    result.name.should.equal('created item');
                    return done();
                });
            });
        });

        it("should destroy a fetched item", function(done) {

            return Item.find(42, function(err, item) {

                return item.destroy(function(err, result) {

                    result.should.equal(item);
                    return Item.find(42, function(err, result) {

                        return done();
                    });
                });
            });
        });

        it("should link to records through many_to_many relationship", function(done) {

            return List.find(51, function(err, list) {

                return list.tags().all(function(err, tags) {

                    tags[0].name.should.equal('supplies');
                    tags[1].name.should.equal('fun');
                    return Tag.find(1, function(err, tag) {

                        return tag.lists().all(function(err, lists) {

                            lists[0].name.should.equal('a list');
                            return done();
                        });
                    });
                });
            });
        });

        return it("should return true if model instance has changed", function(done) {

            return Item.find(42, function(err, item) {

                item.modified().should.equal(false);
                item.name = 'walther smith';
                item.modified().should.equal(true);
                return done();
            });
        });
    });

    describe("Dataset", function() {

        it("should the first record", function(done) {

            var ds;
            ds = DB.ds('lists');
            return ds.first(function(err, row) {

                row.id.should.equal(51);
                row.name.should.equal('a list');
                return done();
            });
        });

        it("should get all record", function(done) {

            var dataset;
            dataset = DB.ds('items');
            return dataset.all(function(err, items, fields) {

                items[0].name.should.equal('another item');
                items[1].name.should.equal('an item');
                return done();
            });
        });

        it("should count as ds", function(done) {

            var dataset;
            dataset = DB.ds('items');
            return dataset.count(function(err, count) {

                count.should.equal(2);
                return done();
            });
        });

        it("should insert data", function (done) {

            var dataset;
            dataset = DB.ds('items');

            dataset.insert({
                name: 'inserted item',
                list_id: 12
            }, function(err, row_id) {

                expect(err).to.equal(null);
                dataset.where({
                    name: 'inserted item'
                }).all(function(err, results) {

                    expect(results.length).to.equal(1);
                    expect(results[0].name).to.equal('inserted item');
                    row_id.should.equal(results[0].id);
                    done();
                });
            });
        });

        it("should update data", function(done) {

            var dataset;
            dataset = DB.ds('items');
            return dataset.update({
                name: 'jesse pinkman'
            }, function(err, affected_rows) {

                return dataset.where({
                    name: 'jesse pinkman'
                }).all(function(err, results) {

                    results[0].name.should.equal('jesse pinkman');
                    affected_rows.should.equal(results.length);
                    return done();
                });
            });
        });

        it("should behave well even if some values are bad", function(done) {

            var dataset;
            dataset = DB.ds('items');
            return dataset.insert({
                blah: 'inserted item'
            }, function(err, row_id) {

                err.should.exist;
                return done();
            });
        });

        it("should truncate table", function(done) {

            var dataset;
            dataset = DB.ds('items');
            return dataset.truncate(function(err) {

                return dataset.all(function(err, items, fields) {

                    items.length.should.equal(0);
                    return done();
                });
            });
        });

        return it("should execute arbitrary command", function(done) {

            var dataset;
            dataset = DB.ds('items');
            return dataset.execute("TRuncATE `items`", function(err) {

                return dataset.all(function(err, items, fields) {

                    items.length.should.equal(0);
                    return done();
                });
            });
        });
    });

    return describe("Model Validation", function() {

        return it("should validate uniqueness", function(done) {

            var Tag = DataStorm.model('tag', DB);
            Tag.validate('name', DataStorm.validation.unique);

            var tag = new Tag({
                name: "wish"
            });

            return tag.validate(function(err, finished) {

                JSON.stringify(tag.errors).should.equal('{"name":["is already taken"]}');
                return done();
            });
        });
    });
});
