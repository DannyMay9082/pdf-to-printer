"use strict";

import execAsync from "../../src/execAsync";
import { list } from "../../src/win32";

jest.mock("../../src/execAsync");

afterEach(() => {
  // restore the original implementation
  execAsync.mockRestore();
});

const mockPrinterListStdout = `
Name                        

Windows Printer         

Zebra                            

        `;

const mockPrinterListWithDefaultStdout = `
Default     Name                        
FALSE       Windows Printer         
TRUE        Zebra                            
        `;

test("returns list of available printers", () => {
  execAsync.mockImplementation((_, [], callback) =>
    Promise.resolve(callback(mockPrinterListStdout))
  );
  // We do not expect "Name" to be in the result because
  // Windows will write to stdout a list of printers under "Name" title.
  return expect(list()).resolves.toStrictEqual(["Windows Printer", "Zebra"]);
});

test("gets the default printer", () => {
  execAsync.mockImplementation((_, [], callback) =>
    Promise.resolve(callback(mockPrinterListWithDefaultStdout))
  );
  // We do not expect "Name" to be in the result because
  // Windows will write to stdout a list of printers under "Name" title.
  return expect(list(true)).resolves.toStrictEqual("Zebra");
});

test("test no default printer defined", () => {
  execAsync.mockImplementation((_, [], callback) =>
    Promise.resolve(callback(""))
  );
  return expect(list(true)).resolves.toStrictEqual("");
});

test("fails with an error", () => {
  execAsync.mockImplementation(() => Promise.reject("error"));
  return expect(list()).rejects.toBe("error");
});
