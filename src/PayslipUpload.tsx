import React from "react";
import { Upload, Icon, message } from "antd";
import { CA, FED, TaxBracket } from "./utils/taxBrackets";
import { PayslipData } from "./@types/public";
import { ParsedPaylsip, ParsedBTETSnippet } from "./@types/PayslipUpload";
const { Dragger } = Upload;

function hex2a(hexEncodedString: string) {
  const hex = hexEncodedString.toString(); //force conversion
  let str = "";
  for (let i = 0; i < hex.length && hex.substr(i, 2) !== "00"; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

function matchRegex(str: string, regex: RegExp, group = 0) {
  const matches: string[] = [];
  let regExResult: RegExpExecArray | null;
  while ((regExResult = regex.exec(str))) {
    matches.push(regExResult[group]);
  }
  return matches;
}

function extractNumber(str: string, nth = 0) {
  const regex = /(?:\d{1,3},)?\d{1,3}\.\d{2}/g;
  const matches = matchRegex(str, regex);
  return parseFloat(matches[nth].replace(",", ""));
}

type BTETSnippetOperator = "Tj" | "Td" | "Tw" | "Tf";
function parseBTETSnippet(snippet: string): ParsedBTETSnippet {
  const operators = ["Tj", "Td", "Tw", "Tf"];

  const snippetData = {} as ParsedBTETSnippet;
  let currentOperatorStart = 0;
  for (let i = 0; i <= snippet.length - 1; i++) {
    const op = snippet.substr(i, 2);
    if (operators.includes(op)) {
      let value = snippet.slice(currentOperatorStart, i).trim();
      if (op === "Tj") {
        value = value.replace(/<|>/g, "");
        value = hex2a(value); //.trim()
        if (snippetData[op]) snippetData[op] = snippetData[op].concat(value);
        else snippetData[op] = value;
      } else {
        snippetData[op as BTETSnippetOperator] = value;
      }
      currentOperatorStart = i + 2;
    }
  }
  return snippetData;
}
function parsePayslip(BTETSnippets: string[]) {
  const data = {} as ParsedPaylsip;
  for (const snippet of BTETSnippets) {
    const parsedSnippet = parseBTETSnippet(snippet);
    const snippetId = Math.floor(extractNumber(parsedSnippet.Td, 1));
    data[snippetId] = parsedSnippet.Tj;
  }
  return data;
}
function calculateOwedTaxesForBrackets(ytdWages: number, brackets: TaxBracket[]) {
  let owedTaxes = 0;
  for (const bracket of brackets) {
    if (ytdWages > bracket.start) {
      const taxableWageInThisBracket = Math.min(ytdWages, bracket.end) - bracket.start;
      owedTaxes += taxableWageInThisBracket * bracket.rate;
    }
  }
  return owedTaxes;
}
function calculateOwedTaxes(ytdWages: number, ytdOtherBenefits: number) {
  const disabilityTax = (ytdWages + ytdOtherBenefits) * 0.01;
  return calculateOwedTaxesForBrackets(ytdWages, CA) + calculateOwedTaxesForBrackets(ytdWages, FED) + disabilityTax;
}
function extractDate(string: string, nth: number) {
  const regex = /[0-9]{2}\/\d{2}\/\d{4}/g;
  const matches = matchRegex(string, regex);
  const dateString = matches[nth];
  const dateNumbers = dateString.split("/").map(str => parseFloat(str));
  return new Date(dateNumbers[2], dateNumbers[0] - 1, dateNumbers[1]);
}
function extractPayslipData(file: string): PayslipData {
  const stream = file.match(/stream([\s\S]*?)endstream/)![1]; // first element of match array contains stream and endstream
  const regex = /BT\s*([\s\S]*?)\s*ET/g;
  const BTETSnippets = matchRegex(stream, regex, 1);
  const payslipData = parsePayslip(BTETSnippets);
  console.log(payslipData);
  //console.log(extractNumber(payslipData['697.9']), extractNumber(payslipData['697.9'], 1))
  const ytdFedTaxes = extractNumber(payslipData[499], 1);
  const ytdCATaxes = extractNumber(payslipData[490], 1);
  const ytdDisabilityTaxes = extractNumber(payslipData[481], 1);
  const ytdWages = extractNumber(payslipData[697], 1);
  const ytdOtherBenefits = extractNumber(payslipData[418], 2);
  const periodEnd = extractDate(payslipData[634], 1);

  const ytdPaidTaxes = ytdFedTaxes + ytdCATaxes + ytdDisabilityTaxes;
  const ytdOwedTaxes = calculateOwedTaxes(ytdWages, ytdOtherBenefits);

  const parsed = { ytdPaidTaxes, ytdOtherBenefits, ytdWages, ytdOwedTaxes, periodEnd };
  return parsed;
}
function isValidPayslip(file: string): boolean {
  const stream = file.match(/stream([\s\S]*?)endstream/);
  if (!stream || !stream[1]) return false;
  const regex = /BT\s*([\s\S]*?)\s*ET/g;
  const BTETSnippets = matchRegex(stream[1], regex, 1);
  if (!BTETSnippets || !BTETSnippets[0]) return false;
  return true;
}

interface PayslipUploadProps {
  transmitData: (data: PayslipData) => void;
}
export default class PayslipUpload extends React.Component<PayslipUploadProps> {
  beforeUpload = (file: File) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        message.error(`Error while parsing ${file.name}.`);
        return false;
      }
      message.success(`${file.name} file uploaded successfully.`);
      if (!isValidPayslip(reader.result)) {
        message.error(`Invalid payslip: ${file.name}.`);
        return false;
      }
      const data = extractPayslipData(reader.result);
      this.props.transmitData(data);
    };
    return false;
  };
  render() {
    return (
      <div style={{ margin: "30px 30px 0px 30px" }}>
        <Dragger beforeUpload={this.beforeUpload}>
          <p className="ant-upload-drag-icon">
            <Icon type="inbox" />
          </p>
          <p className="ant-upload-text">Click or drag a payslip to this area</p>
          <p className="ant-upload-hint">Upload your payslip to check it and gain insights into your payments</p>
        </Dragger>
      </div>
    );
  }
}