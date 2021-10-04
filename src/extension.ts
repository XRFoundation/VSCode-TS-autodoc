import axios from 'axios';
import * as vscode from 'vscode';
import * as dotenv from 'dotenv';

import { API_TOKEN } from "./config";

console.log("API TOKEN");
console.log(API_TOKEN);



dotenv.config();

const openingTestText =
	`
	###
	I wrote a test using mocha and chai for the following code:
	export function LoginController() {
	function isValidUserId(userList, user) {
	   return userList.indexOf(user) >= 0;
	}
	return {
		isValidUserId
	  }
	}
	
	### Output
	/* Test */
	it('should return true if valid user id', function(){
		  var isValid = loginController.isValidUserId(['abc123','xyz321'], 'abc123')
		  assert.equal(isValid, true);
	});
	
	###
	I wrote a test using mocha and chai for the following code:
	 function isAuthorizedPromise(user){
		return new Promise(function(resolve){
			setTimeout(function(){resolve(userList.indexOf(user) >= 0)}, 10);
		});
	  }
	
	### Output
	/* Test */
	var chai = require('chai');
	var chaiAsPromised = require('chai-as-promised');
	chai.use(chaiAsPromised).should();
	describe('isAuthorizedPromise', function(){
	  it('should return true if valid user id', function(){
		  return    loginController.isAuthorizedPromise('abc123').should.eventually.be.true;
		});
	});
	
	###
	I wrote a test using mocha and chai for the following code:
`;

const closingTestText =
	`
	### Output
	/* Test */
`;

const openingCommentText =
	`
	### Add tsdoc comments to the following code that explain each step
export function onInsertObjEvent(listener: (obj: Obj) => void): void {
  if (emitter.listenerCount(Event.InsertObj) > 0) {
    throw new MaxListenerExceededError(Event.InsertObj);
  }

  emitter.on(Event.InsertObj, listener);
}

### Output
/**
 * Set the event listener for event {@link Events.InsertObj}.
* 1. First, it checks if the event has any listeners. If it does, it throws an error.
* 2. If there are no listeners, it adds the listener to the event.
* 3. If there are listeners, it throws an error.
This is a common pattern in Node.
 * @param listener - Handler function for the event.
 * @throws {@link MaxListenerExceededException}
 * Thrown if the event is already assigned to another listener.
 * @internal
 */

### Add tsdoc comments to the following code that explain each step
export const processModelAsset = (asset: any, params: AssetLoaderParamType): void => {
  const replacedMaterials = new Map()
  asset.traverse((child) => {
    if (!child.isMesh) return

    if (typeof params.receiveShadow !== 'undefined') child.receiveShadow = params.receiveShadow
    if (typeof params.castShadow !== 'undefined') child.castShadow = params.castShadow

    if (replacedMaterials.has(child.material)) {
      child.material = replacedMaterials.get(child.material)
    } else {
      if (child.material?.userData?.gltfExtensions?.KHR_materials_clearcoat) {
        const newMaterial = new MeshPhysicalMaterial({})
        newMaterial.setValues(child.material) // to copy properties of original material
        newMaterial.clearcoat = child.material.userData.gltfExtensions.KHR_materials_clearcoat.clearcoatFactor
        newMaterial.clearcoatRoughness =
          child.material.userData.gltfExtensions.KHR_materials_clearcoat.clearcoatRoughnessFactor
        newMaterial.defines = { STANDARD: '', PHYSICAL: '' } // override if it's replaced by non PHYSICAL defines of child.material

        replacedMaterials.set(child.material, newMaterial)
        child.material = newMaterial
      }
    }
  })
  replacedMaterials.clear()

  handleLODs(asset)

  if (asset.children.length) {
    asset.children.forEach((child) => handleLODs(child))
  }
}

### Output
/**
* Process a model asset.
* 1. Traverse the asset and its children
* 2. If the child is a Mesh, check if it has a material. If it does, check if it has a userData.gltfExtensions.KHR_materials_clearcoat.
* 3. If it does, create a new MeshPhysicalMaterial and set its values to the original material.
* 4. Set the clearcoat and clearcoatRoughness properties of the new material.
* 5. Set the defines property of the new material to { STANDARD: '', PHYSICAL: '' }.
* 6. Add the new material to the Map of replaced materials.
* 7. Replace the original material with the new material.
* 8. Repeat steps 1-7 for all children.
 * @param asset - Model asset.
 * @param params - Asset loader parameters.
 * @throws {@link MaxListenerExceededException}
* Thrown if the event is already assigned to another listener.
* @internal
*/

 ### Add a thorough explanation of how the following code works using comments and tsdoc:
`;

const closingCommentText =
	`
### Output
`;

export function addComments() {

	try {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		const selection = editor.selection;

		var text = editor.document.getText(selection);
		console.log(text);

		const headers = {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + API_TOKEN
		};
		const data = {
			"prompt": openingCommentText + text + closingCommentText,
			"temperature": 0.1,
			"max_tokens": text.length < 400 ? text.length : 400,
			"top_p": 1,
			"frequency_penalty": 0.1,
			"stop": ["\"\"\"", "###"]
		};
		console.log(data);
		axios.post(
			'https://api.openai.com/v1/engines/davinci/completions',
			data,
			{ headers: headers }
		).then((resp) => {

			if (resp.data.choices && resp.data.choices.length > 0) {
				const document = editor.document;

				vscode.window.showInformationMessage("Request completed!");

				let choice = resp.data.choices[0];
				choice = choice.text.replace(/#.*/, '').replaceAll("\n\n", "\n").replaceAll(" * ", "\n * ");
				console.log(resp.data);

				console.log("choice.text is")
				console.log(choice.text);

				console.log("text is");
				console.log(text)

				editor.edit(editBuilder => {
					editBuilder.replace(selection, choice + text);
				});
			}
		});
	} catch (exception) {
		process.stderr.write(`ERROR received: ${exception}\n`);
	}

}

export function addTest() {

	try {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		const selection = editor.selection;

		var text = editor.document.getText(selection);
		console.log(text);

		const headers = {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + API_TOKEN
		};
		const data = {
			"prompt": openingTestText + text + closingTestText,
			"temperature": 0,
			"max_tokens": text.length < 400 ? text.length : 400,
			"top_p": 1,
			"frequency_penalty": 0,
			"stop": ["\"\"\"", "###"]
		};
		console.log(data);
		axios.post(
			'https://api.openai.com/v1/engines/davinci/completions',
			data,
			{ headers: headers }
		).then((resp) => {

			if (resp.data.choices && resp.data.choices.length > 0) {
				const document = editor.document;

				vscode.window.showInformationMessage("Request completed!");

				let choice = resp.data.choices[0];
				choice = choice.text.replace(/(.*?)<\/script>((.|\n)*)*/i, "$1").replace(/#.*/, '').replaceAll(" * ", "\n * ");


				console.log(resp.data);

				console.log("choice.text is")
				console.log(choice.text);

				console.log("text is");
				console.log(text)

				editor.edit(editBuilder => {
					editBuilder.replace(selection, text + "\n" + choice);
				});
			}
		});
	} catch (exception) {
		process.stderr.write(`ERROR received: ${exception}\n`);
	}

}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider('markdown', new OpenAiCodeCompletion(), {
			providedCodeActionKinds: OpenAiCodeCompletion.providedCodeActionKinds
		}));


	context.subscriptions.push(
		vscode.commands.registerCommand('code-actions-comment.command', () => addComments()),
		vscode.commands.registerCommand('code-actions-test.command', () => addTest())

	);
}

export class OpenAiCodeCompletion implements vscode.CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix
	];

	public provideCodeActions(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction[] | undefined {
		if (!this.isNotEmptyText(document, range)) {
			return;
		}

		const makeRequestAndReplace = this.createFix(document, range);
		makeRequestAndReplace.isPreferred = true;

		return [
			makeRequestAndReplace,
		];
	}

	private isNotEmptyText(document: vscode.TextDocument, range: vscode.Range) {
		const start = range.start;
		const line = document.lineAt(start.line);
		return line.text[start.character] !== ' ';
	}

	private createFix(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction {
		const fix = new vscode.CodeAction(`Comment`, vscode.CodeActionKind.QuickFix);
		fix.command = { command: COMMAND, title: 'Comment', tooltip: 'This will replace the selected text' };;
		return fix;
	}
}