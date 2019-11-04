import React from "react"
import { Upload, Icon, message } from 'antd';
const operators = ['Tj', 'Td', 'Tw', 'Tf']
const { Dragger } = Upload;
function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function parsePayslip(data) {
    const stream = data.match(/stream([\s\S]*?)endstream/)[1] // first element of match array contains stream and endstream
    let regex = /BT\s*([\s\S]*?)\s*ET/g
    var matches = [];
    let m
    while (m = regex.exec(stream)) {
        matches.push(m[1]);
    }
    const q = []
    for (const match of matches) {
        const l = {}
        let currentOperatorStart = 0;
        for (let i = 0; i <= match.length - 1; i++) {
            let foundOperator = match.substr(i, 2)
            if (operators.includes(foundOperator)) {
                let value = match.slice(currentOperatorStart, i).trim()
                if (foundOperator === "Tj") {
                    value = value.replace(/<|>/g, "")
                    value = hex2a(value).trim()
                    console.log(l[foundOperator], value)
                    if (l[foundOperator]) l[foundOperator].push(value)
                    else l[foundOperator] = [value]

                } else {
                    l[foundOperator] = value

                }
                currentOperatorStart = i + 2
            }
        }
        q.push(l)

    }

    console.log(q)
}
export default class Test extends React.Component {
    lol = (file) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
            //console.log(reader.result)
            message.success(`${file.name} file uploaded successfully.`);
            parsePayslip(reader.result)

        }
        return false
    }
    render() {
        const props = {
            name: 'file',
            //action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
            beforeUpload: this.lol,

        };
        return (<>
            <Dragger {...props}>
                <p className="ant-upload-drag-icon">
                    <Icon type="inbox" />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">
                    Upload your payslip to check it for correct payment
                </p>
            </Dragger>

        </>)

    }
}

