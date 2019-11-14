import React from "react"
import { Upload, Icon, message } from 'antd';
import { CA, FED } from './utils/taxBrackets'
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
                value = hex2a(value)//.trim()
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
function calculateOwedTaxesForBrackets(ytdWages, brackets) {
    let owedTaxes = 0;
    for (const bracket of brackets) {
        if (ytdWages > bracket.start) {
            const taxableWageInThisBracket = Math.min(ytdWages, bracket.end) - bracket.start
            owedTaxes += taxableWageInThisBracket * bracket.rate

        }
    }
    return owedTaxes
}
function calculateOwedTaxes(ytdWages, ytdOtherBenefits) {
    const disabilityTax = (ytdWages + ytdOtherBenefits) * 0.01
    return calculateOwedTaxesForBrackets(ytdWages, CA) + calculateOwedTaxesForBrackets(ytdWages, FED) + disabilityTax
}
function extractDate(string, nth) {
    const regex = /[0-9]{2}\/\d{2}\/\d{4}/g
    const matches = matchRegex(string, regex)
    const dateString = matches[nth]
    const dateNumbers = dateString.split('/').map(str => parseFloat(str))
    return new Date(dateNumbers[2], dateNumbers[0] - 1, dateNumbers[1])
}
function parsePayslip(data) {
    const stream = data.match(/stream([\s\S]*?)endstream/)[1] // first element of match array contains stream and endstream
    let regex = /BT\s*([\s\S]*?)\s*ET/g
    const BTETSnippets = matchRegex(stream, regex, 1)
    const payslipData = extractPayslipData(BTETSnippets)
    console.log(payslipData)
    //console.log(extractNumber(payslipData['697.9']), extractNumber(payslipData['697.9'], 1))
    const ytdFedTaxes = extractNumber(payslipData[499], 1)
    const ytdCATaxes = extractNumber(payslipData[490], 1)
    const ytdDisabilityTaxes = extractNumber(payslipData[481], 1)
    const ytdWages = extractNumber(payslipData[697], 1)
    const ytdOtherBenefits = extractNumber(payslipData[418], 2)
    const periodEnd = extractDate(payslipData[634], 1)

    const ytdPaidTaxes = ytdFedTaxes + ytdCATaxes + ytdDisabilityTaxes
    const ytdOwedTaxes = calculateOwedTaxes(ytdWages, ytdOtherBenefits)



    const parsed = { ytdPaidTaxes, ytdOtherBenefits, ytdWages, ytdOwedTaxes, periodEnd }
    console.log(parsed)
    return parsed


}
export default class PayslipUpload extends React.Component {
    beforeUpload = (file) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => {
            message.success(`${file.name} file uploaded successfully.`);
            const data = parsePayslip(reader.result)
            this.props.transmitData(data)

        }
        return false
    }
    render() {

        return (<div style={{ margin: "30px 30px 0px 30px" }}>
            <Dragger beforeUpload={this.beforeUpload}
            >
                <p className="ant-upload-drag-icon">
                    <Icon type="inbox" />
                </p>
                <p className="ant-upload-text">Click or drag a payslip to this area</p>
                <p className="ant-upload-hint">
                    Upload your payslip to check it and gain insights into your payments
                </p>
            </Dragger>


        </div >)

    }
}