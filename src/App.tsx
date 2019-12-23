import React from "react";
import PayslipUpload from "./PayslipUpload";
import PayslipDisplay from "./PayslipDisplay";
import { PayslipData } from "./@types/public";

interface AppState {
  data2019?: PayslipData;
  data2020?: PayslipData;
}

function mergePayslipData(data2019: PayslipData | undefined, data2020: PayslipData | undefined) {
  if (!data2019) return data2020;
  if (!data2020) return data2019;
  const mergedData: PayslipData = {
    ytdOtherBenefits: data2019.ytdOtherBenefits + data2020.ytdOtherBenefits,
    ytdOwedTaxes: data2019.ytdOwedTaxes + data2020.ytdOwedTaxes,
    ytdPaidTaxes: data2019.ytdPaidTaxes + data2020.ytdPaidTaxes,
    ytdWages: data2019.ytdWages + data2020.ytdWages,
    periodEnd: data2020.periodEnd,
  };
  return mergedData;
}
export default class App extends React.Component<{}, AppState> {
  state: AppState = { data2019: undefined, data2020: undefined };
  render() {
    return (
      <>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
          <PayslipUpload
            bigText="Upload your last payslip from 2019."
            smallText="This will give you insights covering your whole internship."
            transmitData={data2019 => this.setState({ data2019 })}
          />
          <PayslipUpload
            bigText="Upload your latest payslip from 2020."
            smallText="This will give you insights covering your whole internship."
            transmitData={data2020 => this.setState({ data2020 })}
          />
        </div>

        <PayslipDisplay
          data2020={!!this.state.data2020}
          data2019={!!this.state.data2019}
          payslipData={mergePayslipData(this.state.data2019, this.state.data2020)}
        />
      </>
    );
  }
}
