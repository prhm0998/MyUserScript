var PixivDicTableSwap;
(function (PixivDicTableSwap) {
    window.onload = () => {
        console.log('PixivDicTableSwap2');
        tableSwap();
    };
    function tableSwap() {
        var tables = document.querySelectorAll('table');
        Array.from(tables).forEach((table) => {
            const tableRow = table.querySelectorAll('tr');
            const rowArr = Array.from(tableRow);
            const tobj = $(tableRow[0]);
            if (tobj.has('td > ul').get().length > 0) {
                rowArr.forEach((currentRow, index) => {
                    const cols = currentRow.querySelectorAll('td');
                    if (index % 2) {
                        currentRow.style.backgroundColor = '';
                    }
                    else {
                        currentRow.style.backgroundColor = '#f0f8ff';
                    }
                });
            }
            else {
                if (tableRow.length % 2 === 1)
                    return;
                rowArr.forEach((currentRow, index) => {
                    let isOdd = false;
                    switch (index % 4) {
                        case 0:
                            isOdd = true;
                            break;
                        case 1:
                            isOdd = true;
                            break;
                        case 2:
                            isOdd = false;
                            break;
                        case 3:
                            isOdd = false;
                            break;
                        default:
                            break;
                    }
                    if (isOdd) {
                        currentRow.style.backgroundColor = '';
                    }
                    else {
                        currentRow.style.backgroundColor = '#f0f8ff';
                    }
                });
                for (let index = 0; index < rowArr.length; index = index + 2) {
                    const temp = rowArr[index].innerHTML;
                    rowArr[index].innerHTML = rowArr[index + 1].innerHTML;
                    rowArr[index + 1].innerHTML = temp;
                }
            }
        });
    }
    const tableSwapx = () => {
        var tables = document.getElementsByTagName('table');
        for (var i = 0; i < tables.length; i++) {
            var contents = tables[i].getElementsByTagName('tr');
            for (var j = 0; j < contents.length; j = j + 2) {
                const temp = contents[j].innerHTML;
                contents[j].innerHTML = contents[j + 1].innerHTML;
                contents[j + 1].innerHTML = temp;
            }
            for (var j = 0; j < contents.length; j++) {
                let isOdd = false;
                switch (j % 4) {
                    case 0:
                        isOdd = true;
                        break;
                    case 1:
                        isOdd = true;
                        break;
                    case 2:
                        isOdd = false;
                        break;
                    case 3:
                        isOdd = false;
                        break;
                    default:
                        break;
                }
                if (isOdd) {
                    contents[j].style.backgroundColor = '';
                }
                else {
                    contents[j].style.backgroundColor = '#e0ffff';
                }
            }
        }
    };
})(PixivDicTableSwap || (PixivDicTableSwap = {}));
