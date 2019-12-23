import React from "react";
import PayslipUpload from "./PayslipUpload";
import PayslipDisplay from "./PayslipDisplay";
import { PayslipData } from "./@types/public";

interface AppState {
  data?: PayslipData;
}
export default class App extends React.Component<{}, AppState> {
  state: AppState = { data: undefined };
  render() {
    return (
      <>
        <PayslipUpload transmitData={data => this.setState({ data })} />
        <PayslipDisplay payslipData={this.state.data} />
      </>
    );
  }
}
