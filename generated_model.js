const tf = require('@tensorflow/tfjs-node')
const handle_data = require('./handle_data')
const mailModel = require('./models/mailbox')
const typeModel = require('./models/typesbox')
const getData = (Model) => {
    let query =  Model.find({},{_id: 0, text: 1, type: 1})
    return query
}
let query = getData(mailModel)
query.exec().then((result)=>{
    let words = JSON.parse(JSON.stringify(result))
    let dictionary = handle_data.create_Dictionary(words)
    let type_list = handle_data.typeList(words, typeModel)
    let types_Input = handle_data.fill_types(type_list)
    let wm = handle_data.weight_matrix()
    let vectors = handle_data.create_vectors(wm)
    // console.log('VECTOR: ',vectors,'\n','types: ',type_list,'\n','dictionary: ',dictionary)
    // ======================================
    let word_Input_Tensor = tf.tensor2d(vectors)
    let type_Tensor = tf.tensor1d(types_Input, 'int32')
    let type_input_Tensor = tf.oneHot(type_Tensor,type_list.length)
    //tạo models
    let model = tf.sequential()

    //thêm hiddenlayer
    let hiden = tf.layers.dense({
        inputShape: dictionary.length,
        units: 16,
        activation: "sigmoid",
    })

    let output = tf.layers.dense({
        units: type_list.length,
        activation: "softmax",
    })

    model.add(hiden)
    model.add(output)

    model.compile({
        optimizer: tf.train.sgd(0.2),
        loss: "categoricalCrossentropy"
    })
    //train models
    let options = {
        epochs: 100,
        validationSplit: 0.1,
        shuffle: true
    }
    // models.weights.forEach(w=>{
    //     console.log(w.name, w.shape);
    // })
    async function train(){
        await model.fit(word_Input_Tensor,type_input_Tensor,options)
        await model.save('file://model')
    }
    // train()
})
