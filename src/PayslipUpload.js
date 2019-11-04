import React from "react"
import { Upload, Icon, message } from 'antd';
const { Dragger } = Upload;

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

function matchRegex(string, regex, group = 0) {
    var matches = [];
    let m
    while (m = regex.exec(string)) {
        matches.push(m[group]);
    }
    return matches
}

function extractNumber(string, nth = 0) {
    const regex = /(?:\d{1,3},)?\d{1,3}\.\d{2}/g
    const matches = matchRegex(string, regex)
    return parseFloat(matches[nth].replace(',', ''))
}

function parseBTETSnippet(snippet) {
    const operators = ['Tj', 'Td', 'Tw', 'Tf']

    const snippetData = {}
    let currentOperatorStart = 0;
    for (let i = 0; i <= snippet.length - 1; i++) {
        let op = snippet.substr(i, 2)
        if (operators.includes(op)) {
            let value = snippet.slice(currentOperatorStart, i).trim()
            if (op === "Tj") {
                value = value.replace(/<|>/g, "")
                value = hex2a(value).trim()
                if (snippetData[op]) snippetData[op] = snippetData[op].concat(value)
                else snippetData[op] = value

            } else {
                snippetData[op] = value

            }
            currentOperatorStart = i + 2
        }
    }
    return snippetData
}
function extractPayslipData(BTETSnippets) {
    const data = {}
    for (const snippet of BTETSnippets) {
        const parsedSnippet = parseBTETSnippet(snippet)
        const snippetId = Math.floor(extractNumber(parsedSnippet.Td, 1))
        data[snippetId] = parsedSnippet.Tj

    }
    return data
}

function parsePayslip(data) {
    const stream = data.match(/stream([\s\S]*?)endstream/)[1] // first element of match array contains stream and endstream
    let regex = /BT\s*([\s\S]*?)\s*ET/g
    const BTETSnippets = matchRegex(stream, regex, 1)
    const payslipData = extractPayslipData(BTETSnippets)
    console.log(payslipData)
    //console.log(extractNumber(payslipData['697.9']), extractNumber(payslipData['697.9'], 1))
    const ytdWages = extractNumber(payslipData[499], 3)
    const ytdFedTaxes = extractNumber(payslipData[499], 1)
    const ytdCATaxes = extractNumber(payslipData[490], 1)
    const ytdDisabilityTaxes = extractNumber(payslipData[481], 1)
    console.log(ytdWages, ytdFedTaxes, ytdCATaxes, ytdDisabilityTaxes)
    const ytdTaxes = ytdFedTaxes + ytdCATaxes + ytdDisabilityTaxes
    const taxPercentage = ytdTaxes / ytdWages
    console.log(ytdTaxes, taxPercentage)


}
export default class PayslipUpload extends React.Component {
    beforeUpload = (file) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
            message.success(`${file.name} file uploaded successfully.`);
            parsePayslip(reader.result)

        }
        return false
    }
    render() {

        return (<>
            <Dragger beforeUpload={this.beforeUpload}
            >
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

