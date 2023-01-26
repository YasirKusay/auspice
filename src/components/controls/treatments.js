import React from "react";
import PropTypes from 'prop-types';
import { connect } from "react-redux";
import { debounce } from "lodash";
import { sidebarField } from "../../globalStyles";
import { controlsWidth, nucleotide_gene } from "../../util/globals";
import { changeColorBy } from "../../actions/colors";
import { analyticsControlsEvent } from "../../util/googleAnalytics";
import { isColorByGenotype, decodeColorByGenotype, encodeColorByGenotype, decodePositions } from "../../util/getGenotype";
import CustomSelect from "./customSelect";

// mapping redux states onto local props
@connect((state) => {
    return {
      geneLength: state.controls.geneLength,
      treatments: state.controls.treatments,
      colorings: state.metadata.colorings,
      geneMap: state.entropy.geneMap
    };
})

class Treatments extends React.Component {
    constructor(props) {
      super(props);
  
      // local state (for local access only)
      this.BLANK_STATE = {
        // These are values for controlled form components, so cannot be null.
        geneSelected: "",
        treatmentSelected: "",
        positionSelected: ""
      };

      const gS = Object.keys(this.props.geneMap)[0]
      const tS = Object.keys(this.props.treatments[gS])[0]

      alert("Treatments")
      alert(gS)
      alert(tS)
      alert(this.props.treatments[gS][tS])

      this.state = this.newState({
        geneSelected: Object.keys(this.props.geneMap)[0],
        // treatmentSelected: Object.keys(this.props.treatments[gS])[0],
        // positionSelected: this.props.treatments[gS][tS]
      });
    }

    static propTypes = {
      colorBy: PropTypes.string.isRequired,
      geneLength: PropTypes.object.isRequired,
      treatments: PropTypes.object.isRequired,
      colorings: PropTypes.object.isRequired,
      dispatch: PropTypes.func.isRequired
    }
  
    // Applies the given state to the immutable blank state and replaces the
    // current state with the result.
    replaceState(state) {
      this.setState((oldState, props) => this.newState(state)); // eslint-disable-line no-unused-vars
    }
  
    newState(state) {
      return {
        ...this.BLANK_STATE,
        ...state
      };
    }

  
    // State from the outside world enters via props.
    // Invoked just before rendering occurs
    componentWillReceiveProps(nextProps) {
      alert("componentWillReceiveProps()")
      alert(JSON.stringify(this.props.colorBy))
      alert(JSON.stringify(nextProps.colorBy))
      alert(JSON.stringify(this.state))

      if (this.props.colorBy !== nextProps.colorBy) {
        if (isColorByGenotype(nextProps.colorBy)) {
          const genotype = decodeColorByGenotype(nextProps.colorBy);
          alert(JSON.stringify(genotype))

          if (genotype) {

            const oldGenotype = this.state.geneSelected 
            const oldTreatment = this.state.treatmentSelected

            // no need to manually replace treatment, unless gene was changed
            this.replaceState({
              geneSelected: genotype.gene,
              positionSelected: genotype.positions.join(","),
              treatmentSelected: this.state.geneSelected === oldGenotype ? oldTreatment : Object.keys(nextProps.treatments[oldGenotype])[0]
            });
          }
        }
      }
      alert(JSON.stringify(this.state))
    }
  
    // called immediately after updating occurs (except for when initially loading)
    // Our internal state is published back to the outside world when it changes.
    componentDidUpdate() {
      alert("componentDidUpdate()")

      // we do not want to dispatch a change when a user selects a different gene
      // we would like to give them a chance to select a gene first

      // Only dispatch a change to the app's colorBy if we have a
      // fully-specified genotype (gene and position).
      if (this.state.geneSelected && this.state.positionSelected !== "") {
        const genotype = encodeColorByGenotype({
          gene: this.state.geneSelected,
          positions: decodePositions(this.state.positionSelected, this.props.geneLength[this.state.geneSelected])
        });
  
        if (genotype) {
          this.dispatchColorByGenotype(genotype);
        }
      }
    }
  
    /**
     * Avoids double invocation of change() method
     */
    
    // called when state/props changed
    shouldComponentUpdate(nextProps, nextState) {
      alert("shouldComponentUpdate")
      alert(this.state.treatmentSelected)
      alert(nextState.treatmentSelected)
      if (this.state.geneSelected !== nextState.geneSelected) {
        return true
      } else if (this.state.treatmentSelected !== nextState.treatmentSelected) {
        return true
      }
      alert("false")
      return false;

      /*
      if (this.state.geneSelected === nextState.geneSelected &&
          this.state.treatmentSelect === nextState.treatmentSelect &&
          this.state.positionSelected === nextState.positionSelected &&
          this.props.colorings === nextProps.colorings) {
        return false;
      }
      return true;
      */
    }
  
    dispatchColorBy(colorBy, name = colorBy) {
      analyticsControlsEvent(`color-by-${name}`);
      // changeColourBy is the redux behaviour
      // it gets passed the genes + positions, enables changing of the display
      this.props.dispatch(changeColorBy(colorBy));
    }
  
    dispatchColorByGenotype = debounce((genotype) => {
      this.dispatchColorBy(genotype, "genotype");
    }, 400);
  
    getTreatmentOptions() {
      alert(this.props.treatments[this.state.geneSelected])
      const options = [];
      if (this.props.treatments[this.state.geneSelected]) {
        alert("HEHE")
        alert(this.state.geneSelected)
        alert(this.props.treatments[this.state.geneSelected])
        Object.keys(this.props.treatments[this.state.geneSelected]).forEach((treat) => options.push({value: treat, label: treat}));
      }
      return options;
    }

    treatmentSelect() {
      const styles = this.getStyles();
  
      const currTreatmentOptions = this.getTreatmentOptions();
      const currGeneSelected = this.state.geneSelected

      alert("treatmentSelect()")
      alert(this.state.treatmentSelected)
      alert(JSON.stringify(currTreatmentOptions.filter(({value}) => value === this.state.treatmentSelected)))
    
      return (
        <div style={styles.base} id="viewTreaments">
          <CustomSelect
            name="viewTreatmentLocationsInsideGenes"
            id="viewTreatmentLocationsInsideGenes"
            placeholder="treatment"
            value={currTreatmentOptions.filter(({value}) => value === this.state.treatmentSelected)}
            options={currTreatmentOptions}
            isClearable={false}
            isSearchable
            isMulti={false}
            onChange={(opt) => {
              alert("treatment change detected")
              alert(opt.value)
              this.setState({ 
                treatmentSelected: opt.value,
                positionSelected: this.props.treatments[currGeneSelected][opt.value]
              });
            }}
          />
        </div>
      );
    }
  
    isNormalInteger(str) {
      const n = Math.floor(Number(str));
      return String(n) === str && n >= 0;
    }
  
    getStyles() {
      return {
        base: {
          width: controlsWidth,
          marginBottom: 0,
          fontSize: 14
        }
      };
    }
  
    getGtGeneOptions() {
      const options = [];
      if (this.props.treatments) {
        Object.keys(this.props.treatments).forEach((prot) => options.push({value: prot, label: prot}));
      }
      return options;
    }

    render() {
      const styles = this.getStyles();
  
      const gtGeneOptions = this.getGtGeneOptions();

      alert("render()")
      alert(JSON.stringify(gtGeneOptions.filter(({value}) => value === this.state.geneSelected)))
    
  
      return (
        <div style={styles.base} id="viewGenesForTreatment">
          <CustomSelect
            name="viewGeneAvailableForTreatment"
            id="viewGeneAvailableForTreatment"
            placeholder="gene…"
            value={gtGeneOptions.filter(({value}) => value === this.state.geneSelected)}
            options={gtGeneOptions}
            isClearable={false}
            isSearchable
            isMulti={false}
            onChange={(opt) => {
              this.setState({ geneSelected: opt.value,
                treatmentSelected: "",
                positionSelected: ""
              });
            }}
          />
          <div>
            {this.treatmentSelect()}
          </div>
        </div>
        );
    }
  }

export const TreatmentInfo = (
  <>
    View treatment options that target specific genes.
    <br/>
    The positions that the treatment targets on the gene will be displayed on the phylogeny in a consistent manner.
  </>
);
  
export default Treatments;