import React from "react";
import { Upload, Icon, message, Checkbox } from "antd";
import { TaxBracket, californiaTaxBrackets, federalTaxBrackets } from "./utils/taxBrackets";
import { PayslipData } from "./@types/public";
import { ParsedPaylsip, ParsedBTETSnippet } from "./@types/PayslipUpload";
import { UploadChangeParam } from "antd/lib/upload";
import { UploadFile } from "antd/lib/upload/interface";
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
function calculateOwedTaxes(ytdWages: number, ytdOtherBenefits: number, periodEnd: Date) {
  const disabilityTax = (ytdWages + ytdOtherBenefits) * 0.01;
  const californiaTax = calculateOwedTaxesForBrackets(ytdWages, californiaTaxBrackets(periodEnd.getFullYear()));
  const federalTax = calculateOwedTaxesForBrackets(ytdWages, federalTaxBrackets(periodEnd.getFullYear()));
  return californiaTax + federalTax + disabilityTax;
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
  const ytdNonWagePay = (payslipData[571] || "").includes("ApprecAward") ? extractNumber(payslipData[571], 1) : 0;
  const ytdWages = extractNumber(payslipData[697], 1);
  const ytdOtherBenefits = extractNumber(payslipData[418], 2);
  const periodEnd = extractDate(payslipData[634], 1);

  const ytdPaidTaxes = ytdFedTaxes + ytdCATaxes + ytdDisabilityTaxes;
  const ytdOwedTaxes = calculateOwedTaxes(ytdWages, ytdOtherBenefits, periodEnd);

  const parsed = { ytdPaidTaxes, ytdOtherBenefits, ytdWages, ytdOwedTaxes, periodEnd, ytdNonWagePay };
  console.log(parsed);
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

type PayslipUploadProps = {
  transmitData: (data?: PayslipData) => void;
  is2019?: boolean;
};

type PayslipUploadState = { fileList: UploadFile<any>[]; usingCache: boolean };
export default class PayslipUpload extends React.Component<PayslipUploadProps, PayslipUploadState> {
  state: PayslipUploadState = { fileList: [], usingCache: false };
  beforeUpload = (file: File) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        message.error(`Error while parsing ${file.name}.`);
        return false;
      }
      if (!isValidPayslip(reader.result)) {
        message.error(`Invalid payslip: ${file.name}.`);
        return false;
      }
      const data = extractPayslipData(reader.result);
      if (this.props.is2019) {
        if (data.periodEnd.getMonth() !== 11) {
          message.error("Provided payslip is not last of 2019!");
          this.setState({ fileList: [] });
          return false;
        }
        window.localStorage.setItem("data2019", JSON.stringify(data));
        this.setState({ usingCache: false });
      }
      if (!this.props.is2019) {
        if (data.periodEnd.getFullYear() !== 2020) {
          message.error("Provided payslip is not of 2020!");
          this.setState({ fileList: [] });
          return false;
        }
      }
      message.success(`${file.name} file uploaded successfully.`);

      this.props.transmitData(data);
    };
    return false;
  };
  onChange = (info: UploadChangeParam<UploadFile<any>>) => {
    if (info.fileList.length === 0) this.props.transmitData();
    this.setState({ fileList: info.fileList.slice(-1) });
  };

  bigText = () => {
    if (this.props.is2019) {
      if (this.state.usingCache) return "Using cached last payslip of 2019!";
      if (this.fileIsUploaded()) return "Thank you for uploading your last payslip from 2019!";
      return "Upload your last payslip of 2019!";
    }
    if (this.fileIsUploaded()) return "Thank you for uploading your latest payslip from 2020!";
    return "Upload your latest payslip of 2020!";
  };

  smallText = () => {
    if (this.props.is2019) {
      if (this.state.usingCache) return "You just saved yourself a minute of your life by using the cache.";
      return "The data will be securely stored on your computer, so you don't have to upload it again next time.";
    }
    if (this.fileIsUploaded()) return "Have fun with your analysis!";
    return "This will provide you with insights over your whole internship.";
  };

  fileIsUploaded = () => this.state.usingCache || this.state.fileList.length === 1;
  componentDidMount() {
    if (!this.props.is2019) return;
    const cachedData = window.localStorage.getItem("data2019");
    if (cachedData) {
      const parsedCachedData: PayslipData = JSON.parse(cachedData);
      parsedCachedData.periodEnd = new Date(parsedCachedData.periodEnd);
      this.props.transmitData(parsedCachedData);
      this.setState({ usingCache: true });
    }
  }
  render() {
    return (
      <div style={{ width: "50%", height: "100%", margin: "30px 30px 0px 30px" }}>
        <Dragger
          multiple={false}
          fileList={this.state.fileList}
          onChange={this.onChange}
          beforeUpload={this.beforeUpload}
        >
          <p className="ant-upload-drag-icon">
            <Icon type={this.fileIsUploaded() ? "check-circle" : "inbox"} />
          </p>
          <p className="ant-upload-text">{this.bigText()}</p>
          <p className="ant-upload-hint">{this.smallText()}</p>
        </Dragger>
      </div>
    );
  }
}
